'use client'

import Image from "next/image";
import { useSession } from "next-auth/react"

export default function Dashboard() {
  const session = useSession();

  return (
    <div className="p-4">
      Dashboard Page
      <h2>欢迎回来：{ session.data?.user?.name }</h2>
      {
        session.data?.user?.image &&
        <Image
          src={session.data?.user?.image}
          width="30"
          height="30"
          alt="user-avatar"
          className="mr-4"
        />
      }
    </div>
  )
}