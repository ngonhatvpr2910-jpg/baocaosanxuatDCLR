#!/bin/bash
sed -i 's/hourly_workers: log.hourlyWorkers || {},/hourly_workers: { ...(log.hourlyWorkers || {}), "__official": log.hourlyOfficialWorkers || {}, "__seasonal": log.hourlySeasonalWorkers || {} },/g' storage.ts
