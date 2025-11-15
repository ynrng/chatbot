"use client";
import { default as PageTrain } from "@/app/(travel)/train/page";

import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import React, { useState, useCallback } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Page() {

  let [keyword, setKeyword] = useState<string>("");
  let [flights, setFlights] = useState<Array<any>>([]);
  let [flight, setFlight] = useState<any>();

  const [showAddDialog, setShowAddDialog] = useState(false);

  const onInputChange = async () => {
    if (!keyword) {
      return;
    }
    // try {
    //   const response = await fetch(
    //     `/api/flight?id=${keyword}`
    //   );

    //   if (response.ok) {
    //     const data = await response.json();

    //     if (data?.flights?.length) {
    //       setFlights(data.flights);
    //     }

    //     // return flights;
    //   } else {
    //     const { error } = await response.json();
    //     toast.error(error);
    //   }
    // } catch (error) {
    //   console.error("Errors!", error);
    // }
  };


  const handleAdd = async () => {

    // const addPromise = fetch(`/api/flight`, {
    //   method: "POST",
    // });

    // toast.promise(addPromise, {
    //   loading: "Adding flight...",
    //   success: () => {
    //     // mutate((history) => {
    //     //   if (history) {
    //     //     return history.filter((h) => h.id !== id);
    //     //   }
    //     // });
    //     return "Flight addd successfully";
    //   },
    //   error: "Failed to add flight",
    // });

    // setShowAddDialog(false);
    // setKeyword("");
    // setFlights([]);
    // setFlight(null);
  };


  const handleBatchAddStations = async () => {
    fetch(`/api/train/stations`, {
      method: "POST",
    });
  };
  const handleBatchAddBookings = async () => {
    fetch(`/api/train/bookings/jsons`, {
      method: "POST",
    });
  };

  const getBooking = async () => {
    fetch(`/api/train/bookings`, {
      // method: "GET",
    });
  }



    // const { data } = useSWR(`/api/train/bookings`, fetcher);



  return (
    <div className="h-screen w-full pt-12">
      <div className="flex flex-col justify-center pb-4 md:pb-8 bg-background">
        <div className="flex flex-row flex-wrap  items-center gap-4">
          {/* <Input
            // ref={searchRef}
            placeholder="Send a message..."
            value={keyword}
            onChange={(e) => setKeyword(e.currentTarget.value)}
            className="min-h-[24px] overflow-hidden resize-none rounded-lg text-base bg-muted border-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onInputChange();
              }
            }}
          /> */}
          <Button
            onClick={handleBatchAddStations}
          >
            Load train stations from json files
          </Button>
          <Button
            onClick={handleBatchAddBookings}
          >
            Load trainline bookings from json files
          </Button>
          <Button
            onClick={getBooking}
          >
            Fetch booking
          </Button>

        </div>
        {flights && flights.map((f) => (
          <div
            className="flex flex-row justify-around items-center  p-2"
            key={f.fa_flight_id}
            onClick={() => {
              setFlight(f);
              setShowAddDialog(true);
            }}
          >
            <div>
              <div className="font-bold">{f.ident} </div>
              <div className="text-xs text-muted-foreground">
                {f.origin.name}-{f.destination.name}
              </div>
              <div className="text-xs text-muted-foreground">{f.fa_flight_id}</div>
            </div>

            <div className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("en-GB", {
                timeZoneName: 'short',
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                timeZone: f.origin?.timezone || "",
              }).format(new Date(f.scheduled_out))}{" "}
            </div>

            <div className="text-xs text-muted-foreground">
              {f.progress_percent || 0} %
            </div>

          </div>
        ))}
      </div>
      {/* <PageTrain /> */}


      <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hooray!</AlertDialogTitle>
            <AlertDialogDescription>
              Add  {flight ? (flight.ident + ' ' + flight.scheduled_out) : ''} to your flights history?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAdd}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

}