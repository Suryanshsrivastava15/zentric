import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const LEETCODE_GQL = "https://leetcode.com/graphql/";

async function lcFetch(query: string, variables: Record<string, unknown>) {
  const res = await fetch(LEETCODE_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`LeetCode API error: ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = req.nextUrl.searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const [profileRes, recentRes] = await Promise.all([
      lcFetch(
        `query userProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
            profile {
              ranking
              reputation
              solutionCount
            }
          }
          allQuestionsCount {
            difficulty
            count
          }
        }`,
        { username }
      ),
      lcFetch(
        `query recentAC($username: String!) {
          recentAcSubmissionList(username: $username, limit: 15) {
            id
            title
            titleSlug
            timestamp
          }
        }`,
        { username }
      ),
    ]);

    if (!profileRes.data?.matchedUser) {
      return NextResponse.json(
        { error: `LeetCode user "${username}" not found or profile is private` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: profileRes.data.matchedUser,
      allCounts: profileRes.data.allQuestionsCount,
      recentSubmissions: recentRes.data?.recentAcSubmissionList ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch LeetCode data. Please try again." },
      { status: 500 }
    );
  }
}
