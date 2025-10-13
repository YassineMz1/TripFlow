import HomeClient from "./HomeClient"
import { cookies } from "next/headers"

export default async function HomePage() {
  const cookieStore = await cookies()
  const cookieLang = cookieStore.get("lang")?.value
  const initialLang = ["en", "fr", "es", "de"].includes(cookieLang || "") ? (cookieLang as any) : "en"
  return <HomeClient initialLang={initialLang} />
}
