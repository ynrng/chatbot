"use client";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import cx from "classnames";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { User } from "next-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { Flights } from "@/db/schema";
import { fetcher, getTitleFromChat } from "@/lib/utils";

import {
  InfoIcon,
  MenuIcon,
  MoreHorizontalIcon,
  PencilEditIcon,
  InformationIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

export const History = ({ user }: { user: User | undefined }) => {
  const { id } = useParams();
  // const pathname = usePathname();

  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<any>(user ? "/api/flight/history" : null, fetcher, {
    fallbackData: {},
  });

  // useEffect(() => {
  //   mutate();
  // }, [pathname, mutate]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/flight?id=${deleteId}`, {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting flight...",
      success: () => {
        mutate((history:any) => {
          if (history) {
            return history.flights.filter((h:any) => h.fa_flight_id !== id);
          }
        });
        return "Chat deleted successfully";
      },
      error: "Failed to delete flight",
    });

    setShowDeleteDialog(false);
  };

  return (
    <>
      {/* <Button
        variant="outline"
        className="p-1.5 h-fit"
        onClick={() => {
          setIsHistoryVisible(true);
        }}
      >
        <MenuIcon />
      </Button>

      <Sheet
        open={isHistoryVisible}
        onOpenChange={(state) => {
          setIsHistoryVisible(state);
        }}
      >
        <SheetContent side="left" className="p-3 w-900 bg-muted">
          <SheetHeader>
            <VisuallyHidden.Root>
              <SheetTitle className="text-left">History</SheetTitle>
              <SheetDescription className="text-left">
                {history === undefined ? "loading" : history.length} flights
              </SheetDescription>
            </VisuallyHidden.Root>
          </SheetHeader> */}
      <div className=" w-90  p-2  top-0 bottom-0 left-0 bg-background">

        <div className="text-sm flex flex-row items-center justify-between">
          <div className="flex flex-row gap-2">
            <div className="dark:text-zinc-300">History</div>

            <div className="dark:text-zinc-400 text-zinc-500">
              {history === undefined ? "loading" : history.length} flights
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col">
          {/* {user && (
              <Button
                className="font-normal text-sm flex flex-row justify-between text-white"
                asChild
              >
                <Link href="/">
                  <div>Start a new flight</div>
                  <PencilEditIcon size={14} />
                </Link>
              </Button>
            )} */}

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
              history.flights.map((flight:any) => (
                <div
                  key={flight.ident + flight.scheduled_out}
                  className={cx(
                    "flex flex-row items-center gap-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md p-2",
                    // { "bg-zinc-200 dark:bg-zinc-700": flight.id === id },
                  )}
                >
                  <Button
                    variant="ghost"
                    className={cx(
                      "hover:bg-zinc-200 dark:hover:bg-zinc-700 justify-between p-0 text-sm font-normal flex flex-col items-center gap-2 pr-2 w-full transition-none",
                    )}
                  >
                    {/* <Link
                        href={`/flight/${flight.id}`}
                        className="text-ellipsis overflow-hidden text-left py-2 pl-2 rounded-lg outline-zinc-900"
                      >
                        {getTitleFromChat(flight)}
                      </Link> */}

                    {/* <div>{`${flight.scheduled_out.split('T')[0]} ${flight.ident}`} </div>
                    <div>{`${flight.origin_iata} - ${flight.destination_iata}`}</div> */}

                    <div>{`${flight.scheduled_out.split('T')[0]} ${flight.ident}`} </div>
                    <div className="max-w-32 ">{`${flight.from_airport?.name} - ${flight.to_airport?.name}`}</div>


                  </Button>

                  <Button
                    className="flex flex-row gap-2 items-center justify-start h-fit font-normal  p-2 rounded-sm"
                    variant="ghost"
                    onClick={() => {
                      // setDeleteId(flight.id);
                      // setShowDeleteDialog(true);
                      console.log("delete clicked");
                    }}
                  >
                    <InformationIcon />
                    {/* <div>Fetch Track</div> */}
                  </Button>

                  <Button
                    className="flex flex-row gap-2 items-center justify-start  h-fit font-normal p-2 rounded-sm"
                    variant="ghost"
                    onClick={() => {
                      // setDeleteId(flight.id);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <TrashIcon />
                    {/* <div>Delete</div> */}
                  </Button>

                </div>
              ))}
          </div>
        </div>
        {/* </SheetContent>
      </Sheet> */}
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
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
