"use client";

import React from "react";
import { LogoIcon } from "@/components/icons";
import { siteConfig } from '@/config/site';
import Link from "next/link";

export const CompaniesDropdown = () => {
  return (
    <Link className="flex items-center gap-2" href='/'>
      {<LogoIcon className='w-12 h-12' />}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-medium m-0 text-default-900 -mb-4 whitespace-nowrap">
          {siteConfig.name}
        </h3>
        <span className="text-xs font-medium text-default-500">
          后台管理系统
        </span>
      </div>
    </Link>
  );
};
