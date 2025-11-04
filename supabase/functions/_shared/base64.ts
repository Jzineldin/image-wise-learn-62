import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

/**
 * Safe base64 encoding utilities for large binary data.
 *
 * Use these functions instead of btoa(String.fromCharCode(...new Uint8Array(...)))
 * to avoid RangeError: Maximum call stack size exceeded and to be streaming-friendly.
 */

/**
 * Convert a Uint8Array to a base64 string safely using Deno std.
 */
export function toBase64(uint8: Uint8Array): string {
  return encodeBase64(uint8);
}

/**
 * Convert an ArrayBuffer to a base64 string safely using Deno std.
 */
export function arrayBufferToBase64(ab: ArrayBuffer): string {
  return encodeBase64(new Uint8Array(ab));
}