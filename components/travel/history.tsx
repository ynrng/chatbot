"use client";

import cx from "classnames";
import { useParams, usePathname } from "next/navigation";
import { User } from "next-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { fetcher, } from "@/lib/utils";

import {
  InfoIcon,
  ZeroConfigIcon,
  CheckCircleIcon,
  TrashIcon,
} from "../custom/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";


export const History = ({ user }: { user: User | undefined }) => {
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<any>(user ? "/api/flight/history" : null, fetcher, {
    fallbackData: {},
  });

  const [deleteId, setDeleteId] = useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleFetchTrack = async (flight: any) => {

    const res = fetch(`/api/flight/track`, {
      method: "POST",
      body: JSON.stringify(flight),
    });


    toast.promise(res, {
      loading: "Tracking flight...",
      success: async (data: any) => {
        let p = await data.json()
        mutate((history: any) => {
          if (history) {
            return history.flights.map((h: any) => (
              h.scheduled_out == flight.scheduled_out && h.ident == flight.ident
            ) ? { ...h, positions: p } : h
            );
          }
        });
        return "Flight track successfully";
      },
      error: (e) => "Failed to fetch track data. " + e.message,
    });
  }

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/flight`, {
      method: "DELETE",
      body: JSON.stringify(deleteId),
    });

    toast.promise(deletePromise, {
      loading: "Deleting flight...",
      success: () => {
        mutate((history: any) => {
          if (history) {
            return history.flights.filter((h: any) => !(h.fa_flight_id == deleteId.fa_flight_id || (
              h.scheduled_out == deleteId.scheduled_out && h.ident == deleteId.ident
            )));
          }
        });
        return "Flight deleted successfully";
      },
      error: "Failed to delete flight",
    });

    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className=" w-90  p-2 inset-y-0 left-0 bg-background">

        <div className="text-sm flex flex-row items-center justify-between">
          <div className="flex flex-row gap-2">
            <div className="dark:text-zinc-300">History</div>

            <div className="dark:text-zinc-400 text-zinc-500">
              {history === undefined ? "loading" : history.length} flights
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col">

          <div className="flex flex-col overflow-y-scroll p-1 h-[calc(100dvh-124px)]">
            {!user ? (
              <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
                <InfoIcon />
                <div>Login to save and revisit previous flights!</div>
              </div>
            ) : null}

            {!isLoading && history?.flights?.length === 0 && user ? (
              <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
                <InfoIcon />
                <div>No flights found</div>
              </div>
            ) : null}

            {isLoading && user ? (
              <div className="flex flex-col">
                {[44, 32, 28, 52].map((item) => (
                  <div key={item} className="p-2 my-[2px]">
                    <div
                      className={`w-${item} h-[20px] rounded-md bg-zinc-200 dark:bg-zinc-600 animate-pulse`}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {history.flights &&
              history.flights.map((flight: any) => (
                <div
                  key={flight.ident + flight.scheduled_out}
                  className={cx(
                    "flex flex-row items-center gap-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md p-2",
                  )}
                >
                  <Button
                    variant="ghost"
                    className={cx(
                      "hover:bg-zinc-200 dark:hover:bg-zinc-700 justify-between p-0 text-sm font-normal flex flex-col items-center gap-2 pr-2 w-full transition-none",
                    )}
                  >
                    <div>{`${flight.scheduled_out.split('T')[0]} ${flight.ident}`} </div>
                    <div className="max-w-32 ">{`${flight.from_airport?.name} - ${flight.to_airport?.name}`}</div>


                  </Button>


                  <Button
                    className="flex flex-row gap-2 items-center justify-start h-fit font-normal  p-2 rounded-sm"
                    variant="ghost"
                    disabled={flight.positions?.length || flight.status == 'Cancelled'}
                    onClick={() => {
                      console.log("fetch clicked");
                      handleFetchTrack(flight)
                    }}
                  >
                    {flight.status == 'Cancelled' ?
                    // <Tooltip delay={false} text={flight.status || ''}>
                      <ZeroConfigIcon />
                    // </Tooltip>
                      : (
                        flight.positions?.length ? (<CheckCircleIcon />) : (<InfoIcon />)
                      )}
                  </Button>

                  <Button
                    className="flex flex-row gap-2 items-center justify-start  h-fit font-normal p-2 rounded-sm"
                    variant="ghost"
                    onClick={() => {
                      console.log("delete clicked");
                      setDeleteId(flight);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <TrashIcon />
                  </Button>

                </div>
              ))}
          </div>
        </div>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteId ? `${deleteId.from_airport?.name} - ${deleteId.to_airport?.name} on ${deleteId.scheduled_out.split('T')[0]}` : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              flight and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
