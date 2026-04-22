"use client";

import React from "react";
import { LogoIcon } from "@/components/icons";
import { siteConfig } from '@/config/site';
import Link from "next/link";

export const CompaniesDropdown = () => {
  return (
    <Link className="flex items-center gap-2" href='/'>
      {<LogoIcon className='w-12 h-12 dark:invert-100' />}
      <div className="flex flex-col gap-4">
        <h3 className="m-0 -mb-4 whitespace-nowrap text-xl font-medium text-text-base">
          {siteConfig.name}
        </h3>
        <span className="text-xs font-medium text-text-muted">
          后台管理系统
        </span>
      </div>
    </Link>
  );
};
