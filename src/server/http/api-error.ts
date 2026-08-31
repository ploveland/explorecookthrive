import { NextResponse } from "next/server";
import { InvalidStorageIdError } from "@/server/fs/safe-path";

export const INVALID_ID_MESSAGE = "That identifier is not valid.";
export const SESSION_REQUIRED_MESSAGE = "We could not confirm this kitchen session.";

export function invalidIdResponse() {
  return NextResponse.json({ code: "invalid_id", message: INVALID_ID_MESSAGE }, { status: 400 });
}

export function sessionRequiredResponse(message = SESSION_REQUIRED_MESSAGE) {
  return NextResponse.json({ code: "sign_in_required", message }, { status: 401 });
}

export function notFoundResponse(message: string) {
  return NextResponse.json({ code: "not_found", message }, { status: 404 });
}

export function jsonErrorFromUnknown(error: unknown) {
  if (error instanceof InvalidStorageIdError) return invalidIdResponse();
  return null;
}
