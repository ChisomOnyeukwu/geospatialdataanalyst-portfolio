CREATE SCHEMA IF NOT EXISTS "Lab3";

CREATE TABLE "Lab3"."CalgaryCommunities" AS
SELECT *
FROM "Lab1"."CalgaryCommunities";

CREATE TABLE "Lab3"."CalgaryNW" AS (SELECT * FROM "Lab3"."CalgaryCommunities"
WHERE sector = 'NORTHWEST');

CREATE INDEX calgarynw_geom3776_idx
ON "Lab3"."CalgaryNW"
USING GIST (geom3776);

--1. Dissolve Policy Plan Boundaries by Status
DROP TABLE IF EXISTS "Lab3"."PPB_ByStatus";

CREATE TABLE "Lab3"."PPB_ByStatus" AS
SELECT
  "status",
  ST_Multi(ST_Union(geom3776)) AS geom3776
FROM "Lab3"."PolicyPlanBoundaries"
GROUP BY "status";

CREATE INDEX ppb_bystatus_gix ON "Lab3"."PPB_ByStatus" USING GIST (geom3776);

--2. Intersection of SOUTH sector with "L.R.T Policy"
DROP TABLE IF EXISTS "Lab3"."South_LRT_Intersection";

CREATE TABLE "Lab3"."South_LRT_Intersection" AS
WITH south AS (
  SELECT ST_Union(geom3776) AS g
  FROM "Lab3"."Sectors"       
  WHERE "sector" = 'SOUTH'
),
lrt AS (
  SELECT ST_Union(geom3776) AS g
  FROM "Lab3"."PolicyPlanBoundaries" 
  WHERE "plan_type" = 'L.R.T. Policy'
)
SELECT ST_Multi(ST_Intersection(south.g, lrt.g)) AS geom3776
FROM south, lrt;

CREATE INDEX south_lrt_gix
  ON "Lab3"."South_LRT_Intersection" USING GIST (geom3776);

-- 3. Areas in the NORTHEAST outside the "Area Structure Plan"
DROP TABLE IF EXISTS "Lab3"."NE_Not_ASP";

CREATE TABLE "Lab3"."NE_Not_ASP" AS
WITH ne AS (
  SELECT ST_Union(geom3776) AS g
  FROM "Lab3"."Sectors"
  WHERE "sector" = 'NORTHEAST'
),
asp AS (
  SELECT ST_Union(geom3776) AS g
  FROM "Lab3"."PolicyPlanBoundaries"
  WHERE "plan_type" = 'Area Structure Plan'
)
SELECT ST_Multi(
         ST_Difference(ne.g, COALESCE(asp.g, ST_GeomFromText('GEOMETRYCOLLECTION EMPTY',3776)))
       ) AS geom3776
FROM ne LEFT JOIN asp ON TRUE;

CREATE INDEX ne_not_asp_gix
  ON "Lab3"."NE_Not_ASP" USING GIST (geom3776);

-- 4. Shared Boundary between WEST and NORTHWEST Sectors
DROP TABLE IF EXISTS "Lab3"."West_Communities";

CREATE TABLE "Lab3"."West_Communities" AS
SELECT *
FROM "Lab3"."CalgaryCommunities"
WHERE sector = 'WEST';

CREATE INDEX west_communities_gix
  ON "Lab3"."West_Communities" USING GIST (geom3776);

DROP TABLE IF EXISTS "Lab3"."West_NW_SharedBoundary";

-- Create a new table containing the shared border
CREATE TABLE "Lab3"."West_NW_SharedBoundary" AS
WITH west AS (
    SELECT ST_Union(geom3776) AS geom
    FROM "Lab3"."Sectors"
    WHERE sector = 'WEST'
),
nw AS (
    SELECT ST_Union(geom3776) AS geom
    FROM "Lab3"."Sectors"
    WHERE sector = 'NORTHWEST'
)
SELECT 
    ST_Multi(
        ST_Intersection(
            ST_Boundary(west.geom), 
            ST_Boundary(nw.geom)
        )
    )::geometry(MultiLineString, 3776) AS geom3776
FROM west, nw;

-- Create spatial index for faster visualization
CREATE INDEX west_nw_shared_gix
  ON "Lab3"."West_NW_SharedBoundary"
  USING GIST (geom3776);

-- 5. Rivers intersecting GLENMORE Road
-- A) Dissolve roads by Name
DROP TABLE IF EXISTS "Lab3"."Roads_ByName";

CREATE TABLE "Lab3"."Roads_ByName" AS
SELECT
  "name",
  ST_LineMerge(ST_Union(geom3776)) AS geom3776
FROM "Lab3"."MajorRoadNetwork"
GROUP BY "name";

CREATE INDEX roads_byname_gix
  ON "Lab3"."Roads_ByName" USING GIST (geom3776);

-- B) Rivers intersecting GLENMORE
DROP TABLE IF EXISTS "Lab3"."Rivers_x_Glenmore";

CREATE TABLE "Lab3"."Rivers_x_Glenmore" AS
WITH glenmore AS (
  SELECT geom3776 AS g
  FROM "Lab3"."Roads_ByName"
  WHERE UPPER("name") LIKE '%GLENMORE%'
)
SELECT r.*
FROM "Lab3"."HydrologyOutlines" r, glenmore g
WHERE ST_Intersects(r.geom3776, g.g);

CREATE INDEX rivers_x_glenmore_gix
  ON "Lab3"."Rivers_x_Glenmore" USING GIST (geom3776);

-- 6. Communities that TOUCH “UNIVERSITY OF CALGARY”
DROP TABLE IF EXISTS "Lab3"."UCalgary_Touches";

CREATE TABLE "Lab3"."UCalgary_Touches" AS
WITH target AS (
  SELECT geom3776 AS g
  FROM "Lab3"."CalgaryCommunities"
  WHERE UPPER("name") = 'UNIVERSITY OF CALGARY'
)
SELECT c.*
FROM "Lab3"."CalgaryCommunities" c, target t
WHERE ST_Touches(c.geom3776, t.g)
  AND UPPER(c."name") <> 'UNIVERSITY OF CALGARY';

CREATE INDEX ucalgary_touches_gix
  ON "Lab3"."UCalgary_Touches" USING GIST (geom3776);

-- 7. WEST sector communities with no Natural Areas (Disjoint)
DROP TABLE IF EXISTS "Lab3"."West_No_NaturalAreas";

CREATE TABLE "Lab3"."West_No_NaturalAreas" AS
WITH west_comm AS (
  SELECT *
  FROM "Lab3"."CalgaryCommunities"
  WHERE "sector" = 'WEST'
),
nat_union AS (
  SELECT ST_Union(geom3776) AS g
  FROM "Lab3"."NaturalAreas"
)
SELECT w.*
FROM west_comm w, nat_union n
WHERE ST_Disjoint(w.geom3776, n.g) OR n.g IS NULL;

CREATE INDEX west_no_nat_gix
  ON "Lab3"."West_No_NaturalAreas" USING GIST (geom3776);

-- 8. Communities that a River CROSSES
DROP TABLE IF EXISTS "Lab3"."Communities_Crossed_By_Rivers";

CREATE TABLE "Lab3"."Communities_Crossed_By_Rivers" AS
SELECT DISTINCT c.*
FROM "Lab3"."CalgaryCommunities" c
JOIN "Lab3"."HydrologyOutlines" r
  ON ST_Crosses(r.geom3776, c.geom3776);

CREATE INDEX comm_crossed_gix
  ON "Lab3"."Communities_Crossed_By_Rivers" USING GIST (geom3776);

-- 9. Natural Areas that OVERLAP “VARSITY”
DROP TABLE IF EXISTS "Lab3"."NaturalArea_Overlaps_Varsity";

CREATE TABLE "Lab3"."NaturalArea_Overlaps_Varsity" AS
WITH varsity AS (
  SELECT geom3776 AS g
  FROM "Lab3"."CalgaryCommunities"
  WHERE UPPER("COMMUNITY") = 'VARSITY'
)
SELECT n.*
FROM "Lab3"."NaturalAreas" n, varsity v
WHERE ST_Overlaps(n.geom3776, v.g);

CREATE INDEX na_overlaps_varsity_gix
  ON "Lab3"."NaturalArea_Overlaps_Varsity" USING GIST (geom3776);


-- 10. DE-9IM Relation: Natural Area SIL245 vs Silver Springs
WITH na AS (
  SELECT geom3776 AS g
  FROM "Lab3"."NaturalAreas"
  WHERE "asset_cd" = 'SIL245'
),
ss AS (
  SELECT geom3776 AS g
  FROM "Lab3"."CalgaryCommunities"
  WHERE UPPER("name") = 'SILVER SPRINGS'
)
SELECT
  ST_Relate(na.g, ss.g)     AS de9im_matrix,
  ST_Intersects(na.g, ss.g) AS intersects,
  ST_Touches(na.g, ss.g)    AS touches,
  ST_Overlaps(na.g, ss.g)   AS overlaps,
  ST_Within(na.g, ss.g)     AS na_within_ss,
  ST_Contains(ss.g, na.g)   AS ss_contains_na,
  ST_Crosses(na.g, ss.g)    AS crosses,
  ST_Disjoint(na.g, ss.g)   AS disjoint
FROM na, ss;
