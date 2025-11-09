declare module "react-simple-maps" {
    import * as React from "react";
  
    export const ComposableMap: React.FC<any>;
    export const ZoomableGroup: React.FC<any>;
    export const Geographies: React.FC<{
      geography: string | object;
      children: (props: { geographies: any[] }) => React.ReactNode;
    }>;
    export const Geography: React.FC<{
      geography: any;
      style?: any;
      [key: string]: any;
    }>;
  }
  