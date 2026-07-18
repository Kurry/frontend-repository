import { boundAcknowledgement } from "../security/limits.js";
import type { Acknowledgement } from "../types.js";

export function ackOk(
  navigationEpoch: number,
  status = "ok",
  extras?: { public_ids?: string[]; message?: string },
): Acknowledgement {
  return boundAcknowledgement({
    ok: true,
    status,
    navigation_epoch: navigationEpoch,
    ...extras,
  });
}

export function ackRejected(
  navigationEpoch: number,
  status: string,
  message?: string,
): Acknowledgement {
  return boundAcknowledgement({
    ok: false,
    status,
    navigation_epoch: navigationEpoch,
    message,
  });
}

export { boundAcknowledgement };
