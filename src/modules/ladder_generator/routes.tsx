import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const LadderGeneratorPage = lazy(() => import("./pages/LadderGeneratorPage"));

export const ladderGeneratorRoutes: RouteObject[] = [
  { path: "/modules/ladder-generator", element: <LadderGeneratorPage /> },
];
