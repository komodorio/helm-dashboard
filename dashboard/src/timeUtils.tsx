/**
 *
 *
 */
import React from 'react'
import 
export function getAge(date: Date) {
    const resultString = "AGE: "
          + (Math.floor((Date.now() - date.getTime()) / 1000) < 60)
          ? Math.floor((Date.now() - date.getTime()) / 1000) + "s"
          : Math.floor((Date.now() - date.getTime()) / 1000 / 60) < 60
          ? Math.floor((Date.now() - date.getTime()) / 1000 / 60) + "m"
          : Math.floor((Date.now() - date.getTime()) / 1000 / 60 / 60) <
            24
          ? Math.floor((Date.now() - date.getTime()) / 1000 / 60 / 60) +
            "h"
          : Math.floor(
              (Date.now() - date.getTime()) / 1000 / 60 / 60 / 24
            ) + "d";
    return resultString;
}
