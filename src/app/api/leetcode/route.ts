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
    // Step 1: Fetch profile, recent submissions, and daily challenge in parallel
    const [profileRes, recentRes, dailyRes] = await Promise.all([
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
      lcFetch(
        `query questionOfToday {
          activeDailyCodingChallengeQuestion {
            date
            link
            question {
              frontendQuestionId: questionFrontendId
              title
              titleSlug
              difficulty
              acRate
              topicTags {
                name
                slug
              }
            }
          }
        }`,
        {}
      ),
    ]);

    if (!profileRes.data?.matchedUser) {
      return NextResponse.json(
        { error: `LeetCode user "${username}" not found or profile is private` },
        { status: 404 }
      );
    }

    const recentSubs: { id: string; title: string; titleSlug: string; timestamp: string }[] =
      recentRes.data?.recentAcSubmissionList ?? [];

    // Step 2: Find the highest problem number recently solved
    let lastSolvedId = 0;
    let lastSolvedTitle = "";
    if (recentSubs.length > 0) {
      try {
        // Fetch frontendQuestionId for all recent submissions in parallel (max 5)
        const slugsToCheck = recentSubs.slice(0, 5).map((s) => s.titleSlug);
        const idResults = await Promise.all(
          slugsToCheck.map((slug) =>
            lcFetch(
              `query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                  questionFrontendId
                }
              }`,
              { titleSlug: slug }
            ).catch(() => null)
          )
        );
        // Find the highest problem number among recent solved
        idResults.forEach((res, i) => {
          const id = parseInt(res?.data?.question?.questionFrontendId ?? "0");
          if (id > lastSolvedId) {
            lastSolvedId = id;
            lastSolvedTitle = recentSubs[i]?.title ?? "";
          }
        });
      } catch {
        // fallback: start from beginning
      }
    }

    // Step 3: Fetch next 5 problems after the last solved problem number
    const suggestRes = await lcFetch(
      `query problemsetQuestionList($limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: ""
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          questions: data {
            frontendQuestionId: questionFrontendId
            title
            titleSlug
            difficulty
            acRate
            paidOnly: isPaidOnly
            topicTags {
              name
              slug
            }
          }
        }
      }`,
      { limit: 15, skip: lastSolvedId, filters: {} }
    );

    const allSuggestions: {
      frontendQuestionId: string;
      title: string;
      titleSlug: string;
      difficulty: string;
      acRate: number;
      paidOnly: boolean;
      topicTags: { name: string; slug: string }[];
    }[] = suggestRes.data?.problemsetQuestionList?.questions ?? [];

    // Filter out paid problems, take next 5
    const recentSlugs = new Set(recentSubs.map((s) => s.titleSlug));
    const suggestions = allSuggestions
      .filter((q) => !q.paidOnly && !recentSlugs.has(q.titleSlug))
      .slice(0, 5);

    return NextResponse.json({
      user: profileRes.data.matchedUser,
      allCounts: profileRes.data.allQuestionsCount,
      recentSubmissions: recentSubs,
      dailyChallenge: dailyRes.data?.activeDailyCodingChallengeQuestion ?? null,
      suggestions,
      lastSolvedId,
      lastSolvedTitle,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch LeetCode data. Please try again." },
      { status: 500 }
    );
  }
}

