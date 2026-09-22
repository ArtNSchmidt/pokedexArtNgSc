import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { NotFoundPage } from './NotFoundPage';
import { RouteErrorPage } from './RouteErrorPage';

/** As telas vêm de `features/` (A6); o shell só sabe onde encaixá-las. */
export interface AppPages {
  readonly ListPage: ComponentType;
  readonly DetailPage: ComponentType;
}

export const paths = {
  list: '/',
  detail: (idOrName: string | number): string => `/pokemon/${encodeURIComponent(String(idOrName))}`,
} as const;

export function createAppRoutes(pages: AppPages): RouteObject[] {
  return [
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <RouteErrorPage />,
      children: [
        { index: true, element: <pages.ListPage /> },
        { path: 'pokemon/:idOrName', element: <pages.DetailPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ];
}

export function createAppRouter(pages: AppPages) {
  return createBrowserRouter(createAppRoutes(pages));
}
