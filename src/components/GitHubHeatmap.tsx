import { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Github } from 'lucide-react';

// Helper to get all dates from Jan 1, 2025 to today
function getDates(start: Date, end: Date) {
  const dates = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Helper to get week columns (Sunday start)
function getHeatmapMatrix(contributions: Record<string, number>, start: Date, end: Date) {
  const dates = getDates(start, end);
  const matrix: Array<Array<{ date: Date; count: number }>> = [];
  let week: Array<{ date: Date; count: number }> = [];
  dates.forEach((date) => {
    if (week.length === 0 && date.getDay() !== 0) {
      // pad to Sunday
      for (let i = 0; i < date.getDay(); i++) {
        week.push({ date: null as any, count: 0 });
      }
    }
    week.push({ date, count: contributions[date.toISOString().slice(0, 10)] || 0 });
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  });
  if (week.length) {
    while (week.length < 7) week.push({ date: null as any, count: 0 });
    matrix.push(week);
  }
  return matrix;
}

// Helper to get month labels for columns
function getMonthLabels(matrix: Array<Array<{ date: Date; count: number }>>) {
  const labels: string[] = [];
  let lastMonth = '';
  matrix.forEach((week) => {
    const firstDay = week[0].date;
    if (firstDay) {
      const month = firstDay.toLocaleString('default', { month: 'short' });
      if (month !== lastMonth) {
        labels.push(month);
        lastMonth = month;
      } else {
        labels.push('');
      }
    } else {
      labels.push('');
    }
  });
  return labels;
}

// Helper to get streak
function getStreak(contributions: Record<string, number>, end: Date) {
  let streak = 0;
  let current = new Date(end);
  while (contributions[current.toISOString().slice(0, 10)]) {
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// Fetch GitHub contributions (public only)
// Simple in-memory cache for contributions
const contributionsCache = new Map<string, Record<string, number>>();

async function fetchContributions(username: string, year: number): Promise<Record<string, number>> {
  const cacheKey = `${username}:${year}`;
  if (contributionsCache.has(cacheKey)) {
    return contributionsCache.get(cacheKey)!;
  }

  const query = `
        query($username: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $username) {
                contributionsCollection(from: $from, to: $to) {
                    contributionCalendar {
                        weeks {
                            contributionDays {
                                date
                                contributionCount
                            }
                        }
                    }
                }
            }
        }
    `;
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ query, variables: { username, from, to } }),
  });
  const json = await res.json();
  const contributions: Record<string, number> = {};
  const weeks = json.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  weeks.forEach((week: any) => {
    week.contributionDays.forEach((day: any) => {
      contributions[day.date] = day.contributionCount;
    });
  });

  contributionsCache.set(cacheKey, contributions);
  return contributions;
}

export function GitHubHeatmap({ username }: { username: string }) {
  const [contributions, setContributions] = useState<Record<string, number>>({});
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchContributions(username, year).then((data) => {
      setContributions(data);
      setLoading(false);
    });
  }, [username, year]);

  const startDate = useMemo(() => new Date(year === 2025 ? '2025-01-01' : `${year}-01-01`), [year]);
  const endDate = useMemo(() => new Date(), []);
  const matrix = useMemo(
    () => getHeatmapMatrix(contributions, startDate, endDate),
    [contributions, startDate, endDate]
  );
  const monthLabels = useMemo(() => getMonthLabels(matrix), [matrix]);
  const totalContributions = useMemo(
    () => Object.values(contributions).reduce((a, b) => a + b, 0),
    [contributions]
  );
  const streak = useMemo(() => getStreak(contributions, endDate), [contributions, endDate]);

  // Calculate max contributions in a day for scaling
  const maxDay = useMemo(() => Math.max(...Object.values(contributions)), [contributions]);

  // Helper to get cell color (lighter for more commits)
  function getCellClass(count: number) {
    if (count === 0) return 'gh-heatmap-0';
    if (maxDay === 0) return 'gh-heatmap-1';
    const percent = count / maxDay;
    if (percent > 0.8) return 'gh-heatmap-5';
    if (percent > 0.6) return 'gh-heatmap-4';
    if (percent > 0.4) return 'gh-heatmap-3';
    if (percent > 0.2) return 'gh-heatmap-2';
    return 'gh-heatmap-1';
  }

  return (
    <Card className="w-full mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Contributions
        </CardTitle>
        <div className="flex gap-4 mt-2">
          <Badge variant="outline">{totalContributions} Contributions</Badge>
          <Badge variant="secondary">Current Streak: {streak} days</Badge>
          <label htmlFor="year-select" className="sr-only">
            Year
          </label>
          <select
            id="year-select"
            className="ml-auto border rounded px-2 py-1 text-xs bg-muted"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            title="Select year"
          >
            {Array.from({ length: new Date().getFullYear() - 2024 }, (_, i) => 2025 + i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              )
            )}
          </select>
        </div>
        <div>
          <Badge variant="outline" className="mt-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="w-4 h-4 rounded gh-heatmap-0 border border-muted"></span>
              <span className="text-muted-foreground">0</span>
              <span className="w-4 h-4 rounded gh-heatmap-1 border border-muted"></span>
              <span className="text-muted-foreground"> {`<` + 10} </span>
              <span className="w-4 h-4 rounded gh-heatmap-2 border border-muted"></span>
              <span className="text-muted-foreground">{`<` + 20}</span>
              <span className="w-4 h-4 rounded gh-heatmap-3 border border-muted"></span>
              <span className="text-muted-foreground">{`<` + 30}</span>
              <span className="w-4 h-4 rounded gh-heatmap-4 border border-muted"></span>
              <span className="text-muted-foreground">{`<` + 40}</span>
              <span className="w-4 h-4 rounded gh-heatmap-5 border border-muted"></span>
              <span className="text-muted-foreground">{`<` + 50}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-1 mb-2">
              {monthLabels.map((label, i) => (
                <span key={i} className="text-xs text-muted-foreground w-6 text-center">
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {matrix.map((week, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1">
                  {week.map((day, rowIdx) =>
                    day.date ? (
                      <Tooltip key={rowIdx}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-6 h-6 rounded transition-colors duration-200 cursor-pointer border border-muted ${getCellClass(day.count)}`}
                            tabIndex={0}
                            aria-label={`${day.count} contributions on ${day.date.toLocaleDateString()}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {`${day.count} contributions on ${day.date.toLocaleDateString()}`}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div key={rowIdx} className="w-6 h-6 rounded bg-transparent" />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
