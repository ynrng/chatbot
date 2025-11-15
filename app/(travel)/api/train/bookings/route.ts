import { auth } from "@/app/(auth)/auth";
import { getTrainStations, getTrains, updateTrain } from "@/db/queries";


import { fetcherInternal } from "@/lib/utils";

import { fetchRRT } from "@/app/(travel)/api/train/utils";
import locs from './fake.locations.json';

function fetchSegmentsByLocations(locations: any[]) {
  //   todo fetch segments based on locations

  locations = locs
  return null;
}

async function fetchServiceByRecord(s: any, record: any,) {
  let res2 = await fetchRRT(`/json/service/${s.serviceUid}/${s.runDate.replaceAll('-', '/')}`)

  if (Array.isArray(res2?.locations) && res2.locations.length) {
    let start = -1, end = -1;
    for (let i = 0; i < res2.locations.length; i++) {
      if (res2.locations[i].crs == record.origin) {
        start = i;
      }
      else if (res2.locations[i].crs == record.destination) {
        end = i;
      }
    }

    if (start > -1 && end > start) {
      record.locations = res2.locations.slice(start, end + 1).map((v: any) => ({
        tiploc: v.tiploc,
        description: v.description,
        ...(v.crs ? { crs: v.crs, } : null)
      }))

      if (!record.destinationTime || (record.destinationTime && record.destinationTime == res2.locations[end].gbttBookedArrival)) {
        record.serviceUid = res2.serviceUid;
        record.destinationTime = res2.locations[end].gbttBookedArrival;
        return record;
      }
    }

  }
  return null;
}

export async function GET(request: Request) {

  const session = await auth();
  try {
    let records = await getTrains();
    records = records.sort((a, b) => new Date(b.runDate).valueOf() - new Date(a.runDate).valueOf());
    console.log("train records:", records.length);

    let stations = await getTrainStations(null);
    let stationMap: Record<string, any> = {};
    stations.forEach((s) => {
      stationMap[s.crsCode] = s;
    });

    for (let record of records) {
      if (record.transportMode != 'train') {
        continue;
      }
      if (Array.isArray(record.segments) && record.segments.length) {
        // todo
        console.log('11111111:', record.segments);
        continue;
      }
      let needUpdate = false;
      if (!(Array.isArray(record.locations) && record.locations.length)) {
        needUpdate = true;
        if (record.serviceUid) {
          let res3 = await fetchServiceByRecord(record, record);
          if (res3) {
            record = res3;
          }
        } else {

          let day = new Date(record.runDate);
          let today = new Date();
          if (Math.abs(day.valueOf() - today.valueOf()) < 1000 * 60 * 60 * 24 * 7) {

            let res_ser = await fetchRRT(`/json/search/${record.origin}/to/${record.destination}/${record.runDate.replaceAll('-', '/')}/${record.originTime}`);

            if (res_ser?.services?.length) {
              let timefiltered = res_ser.services.filter((s: any) => s.serviceUid && s.locationDetail.gbttBookedDeparture == record.originTime);
              if (timefiltered.length > 0) {
                for (let s of timefiltered) {
                  let res2 = await fetchServiceByRecord(s, record);
                  if (res2) {
                    record = res2;
                    break;
                  }
                }
              }
            }

          } else if (day.valueOf() < today.valueOf()) {
            let url4 = `/json/search/${record.origin}/to/${record.destination}/${today.toISOString().split('T')[0].replaceAll('-', '/')}`;
            if (record.originTime != '0000') {
              url4 += '/' + record.originTime;
            }
            let res4 = await fetchRRT(url4);

            if (res4?.services?.length) {
              let timefiltered = res4.services.filter((s: any) => s.serviceUid && s.locationDetail.gbttBookedDeparture == record.originTime);

              if (!timefiltered.length) {
                timefiltered = res4.services.filter((s: any) => s.serviceUid && s.atocCode == record.atocCode);
              }

              for (let s of timefiltered) {
                let res2 = await fetchServiceByRecord(s, record);
                if (res2) {
                  record = res2;
                  break;
                }
              }
            }
          }

        }
      }
      if (needUpdate) {
        await updateTrain(record)
      }
      if (Array.isArray(record.locations) && record.locations.length) {
        record.locations = record.locations.map((loc: any) => (
          loc.crs ? {
            tiploc: loc.tiploc,
            description: loc.description,
            crs: loc.crs,
            ...(stationMap[loc.crs] || {}),
          } : loc
        ))
        record.segments = fetchSegmentsByLocations(record.locations as any[])
      }
    }

    return Response.json(records);
  } catch (err) {
    console.error("Failed to fetch rrt", err);

  }

  return Response.json({});
}
