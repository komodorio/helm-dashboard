/**
 * @file global.tsx
 *
 * @description This file contains the global types and interfaces that are used in the project.
 *
 * Please import this file in every file that uses the types and interfaces defined here.
 * Currently, it is used in the following files:
 *  1. dashboard\src\components\Status.tsx
 *  2. dashboard\src\components\RevisionCard.tsx
 *
 * The types and interfaces defined here are:
 *  1. StatusCode:
 *     - "Deployed"
 *     - "Superseded"
 *     - "Failed"
 *     it is used to indicate the deployment status of a revision.
 *
 *
 */

import React from "react";
/* declare the statuscode type which can have:
 * 1. "Deployed"
 * 2. "Superseded"
 * 3. "Failed"
 */
export type StatusCode = "Deployed" | "Superseded" | "Failed";
export type BadgeCode = "error" | "warning" | "success" | "info" | "default";
