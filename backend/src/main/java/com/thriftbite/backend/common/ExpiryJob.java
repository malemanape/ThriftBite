package com.thriftbite.backend.common;

import com.thriftbite.backend.alert.Alerts;
import com.thriftbite.backend.photo.Photos;
import com.thriftbite.backend.item.StockEvents;
import com.thriftbite.backend.reservation.ReservationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Housekeeping, in this order: expire missed pickups and restock their food, take
 * expired food off sale, delete month-old alerts, and (hourly) delete unused photos.
 *
 * Runs on a schedule and also from {@link LazyExpiryInterceptor} before stock is read,
 * at most once per {@code lazy-min-gap}: a free host sleeps and runs no schedule, and
 * the first request after waking should see the real stock. Browsing and checkout
 * ignore expired food anyway, so running late never lets anyone buy it.
 */
@Component
public class ExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(ExpiryJob.class);

    /** Alerts older than this are deleted: they're old news, and personal data nobody needs anymore. */
    private static final Duration KEEP_ALERTS = Duration.ofDays(30);
    private static final Duration PHOTO_CLEANUP_GAP = Duration.ofHours(1);

    private final ReservationService reservations;
    private final StockEvents stock;
    private final Alerts alerts;
    private final Photos photos;
    private final Duration lazyMinGap;

    /** One run at a time: the scheduled run and an on-demand run must not restock the same food twice. */
    private final ReentrantLock running = new ReentrantLock();
    private volatile Instant lastRun = Instant.EPOCH;
    private volatile Instant lastPhotoCleanup = Instant.EPOCH;

    public ExpiryJob(ReservationService reservations, StockEvents stock, Alerts alerts, Photos photos,
                     @Value("${app.expiry.lazy-min-gap:PT30S}") Duration lazyMinGap) {
        this.reservations = reservations;
        this.stock = stock;
        this.alerts = alerts;
        this.photos = photos;
        this.lazyMinGap = lazyMinGap;
    }

    /** Always runs, waiting for a run in progress to finish first. */
    @Scheduled(fixedDelayString = "${app.expiry.interval:PT5M}",
               initialDelayString = "${app.expiry.initial-delay:PT1M}")
    public void run() {
        running.lock();
        try {
            sweep();
        } finally {
            running.unlock();
        }
    }

    /**
     * Runs if the last run was more than {@code lazy-min-gap} ago and no run is
     * in progress; otherwise returns at once. Never throws, so a failed sweep
     * can't break the request that triggered it.
     */
    public void runIfDue() {
        if (Duration.between(lastRun, Instant.now()).compareTo(lazyMinGap) < 0 || !running.tryLock()) {
            return;
        }
        try {
            if (Duration.between(lastRun, Instant.now()).compareTo(lazyMinGap) >= 0) {
                sweep();
            }
        } catch (RuntimeException e) {
            // e.g. a buyer cancelled the same reservation at that moment; the next run picks it up
            log.warn("On-demand expiry run failed, will retry on the next one: {}", e.toString());
        } finally {
            running.unlock();
        }
    }

    private void sweep() {
        Instant now = Instant.now();
        lastRun = now;
        int missed = reservations.expireMissedPickups(now);
        int expired = stock.expireOldItems(now);
        alerts.deleteOlderThan(now.minus(KEEP_ALERTS));
        if (Duration.between(lastPhotoCleanup, now).compareTo(PHOTO_CLEANUP_GAP) >= 0) {
            lastPhotoCleanup = now;
            int photosDeleted = photos.deleteUnused();
            if (photosDeleted > 0) {
                log.info("Expiry run: {} unused photos deleted", photosDeleted);
            }
        }
        if (missed > 0 || expired > 0) {
            log.info("Expiry run: {} missed pickups, {} items expired", missed, expired);
        }
    }
}
