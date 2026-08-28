"use client";

import { toast } from "sonner";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SELECT_ITEMS = [
  { value: "merge-pdf", label: "Merge PDF" },
  { value: "compress-pdf", label: "Compress PDF" },
  { value: "ocr-pdf", label: "OCR PDF" },
];

export function UiKitPlayground() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => {
            toast.success("File is ready");
          }}
        >
          Success toast
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            toast("Saved to this session");
          }}
        >
          Default toast
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            toast.error("That file could not be processed");
          }}
        >
          Error toast
        </Button>
      </div>

      <Select defaultValue="merge-pdf" items={SELECT_ITEMS}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SELECT_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Accordion defaultValue="one" className="max-w-xl">
        <AccordionItem value="one">
          <AccordionTrigger>What is this page?</AccordionTrigger>
          <AccordionPanel>
            A development-only gallery of the shadcn primitives. Production
            builds return a 404.
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="two">
          <AccordionTrigger>
            Which tokens map to the reference?
          </AccordionTrigger>
          <AccordionPanel>
            Primary is yellow #FFD43B. Secondary is green #9FE870. Muted and
            accent are the cream and sand surfaces.
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-wrap gap-3">
        <DropdownMenu>
          <Button variant="outline" render={<DropdownMenuTrigger />}>
            Menu
          </Button>
          <DropdownMenuContent>
            <DropdownMenuItem>Account</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" />}>
            Dialog
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace this file?</AlertDialogTitle>
              <AlertDialogDescription>
                The current upload will be discarded.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Replace</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
