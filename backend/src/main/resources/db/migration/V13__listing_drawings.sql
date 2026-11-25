-- A listing without a photo can show one of ThriftBite's food drawings instead.
-- The store picks it; null means the app picks from the listing's name.
ALTER TABLE items ADD COLUMN art VARCHAR(20)
    CHECK (art IN ('rice-bowl', 'veg-bowl', 'cup', 'buns', 'swirl', 'long-bread', 'rolls', 'loaf', 'croissant'));
