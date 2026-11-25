package com.thriftbite.backend.item;

import com.jayway.jsonpath.JsonPath;
import com.thriftbite.backend.ApiTestSupport;
import com.thriftbite.backend.user.Role;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The food drawing a store picks for a listing without a photo, and the limit on search text. */
class ListingArtAndSearchTest extends ApiTestSupport {

    @Test
    void aListingKeepsTheDrawingItsStorePicked() throws Exception {
        String owner = tokenFor(Role.OWNER);
        String created = mvc.perform(post("/api/owner/items")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("Taho " + tag(), "\"cup\"", null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.art").value("cup"))
                .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(created, "$.id");
        Integer version = JsonPath.read(created, "$.version");

        // An edit that sends it again keeps it; buyers see it too.
        mvc.perform(put("/api/owner/items/{id}", id)
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("Taho, 2 cups " + tag(), "\"cup\"", version.longValue())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.art").value("cup"));
        mvc.perform(get("/api/items/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.art").value("cup"));
    }

    @Test
    void onlyTheAppsOwnDrawingsCanBePicked() throws Exception {
        String owner = tokenFor(Role.OWNER);
        for (String art : new String[] {"\"<script>\"", "\"../photo\"", "\"CUP\"", "\"\""}) {
            mvc.perform(post("/api/owner/items")
                            .header("Authorization", bearer(owner))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json("Bread " + tag(), art, null)))
                    .andExpect(status().isBadRequest());
        }
        // Leaving it out is fine: the app picks one from the name.
        mvc.perform(post("/api/owner/items")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("Bread " + tag(), "null", null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.art").value(nullValue()));
    }

    @Test
    void searchTextIsCappedAtTheLongestFoodName() throws Exception {
        mvc.perform(get("/api/items").param("q", "a".repeat(ItemService.MAX_QUERY_LENGTH)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/items").param("q", "a".repeat(ItemService.MAX_QUERY_LENGTH + 1)))
                .andExpect(status().isBadRequest());
    }

    private static String tag() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private static String json(String name, String art, Long version) {
        Instant now = Instant.now();
        return """
                {
                  "name": "%s",
                  "price": 20.00,
                  "originalPrice": 35.00,
                  "quantity": 4,
                  "expiresAt": "%s",
                  "pickupLocation": "Burnham Park, Baguio",
                  "pickupStart": "%s",
                  "pickupEnd": "%s",
                  "version": %s,
                  "art": %s
                }
                """.formatted(name, now.plus(Duration.ofHours(6)), now.plus(Duration.ofMinutes(30)),
                now.plus(Duration.ofHours(3)), version, art);
    }
}
