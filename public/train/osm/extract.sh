rm -rf europe.osm.pbf
osmium merge *.osm.pbf  -o europe.osm.pbf

rm -rf europe_rail.osm.pbf
osmium tags-filter europe.osm.pbf  w/railway=rail w/railway=station -o  europe_rail.osm.pbf

rm -rf europe_rail.geojson
osmium export europe_rail.osm.pbf  -o  europe_rail.geojson



osmium tags-filter united-kingdom-260511.osm.pbf  w/railway=rail,usage=main n/railway=station -o  uk_rail.osm.pbf --overwrite
osmium export uk_rail.osm.pbf  -o  uk_rail.geojson --overwrite



osmium tags-filter united-kingdom-260511.osm.pbf  r/type=route,route=train  -o  uk_rail.osm.pbf --overwrite