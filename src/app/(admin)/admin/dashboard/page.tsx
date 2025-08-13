'use client'

import Image from "next/image";
import { useSession } from "next-auth/react"

export default function Dashboard() {
  const session = useSession();

  return (
    <div>
      Dashboard Page
      <h2>欢迎回来：{ session.data?.user?.name }</h2>
      {
        session.data?.user?.image &&
        <Image
          src={session.data?.user?.image}
          width="25"
          height="25"
          alt="user-avatar"
          className="mr-4"
        />
      }
    </div>
  )
}