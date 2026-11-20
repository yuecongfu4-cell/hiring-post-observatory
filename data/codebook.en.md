# Frozen sample and field definitions

Version: `baseline-20261120-public-1`. Snapshot date: 2026-11-20. The working baseline combines the original frozen tables with education, manufacturing, construction, real estate, two hospitality extensions, an operations/administration collection, a partial healthcare collection, a finance/insurance batch and a public-sector/non-profit batch. The original CSV collection dates and each record's `collectedAt` value remain separate. Every downloadable template contains column headers only, with no simulated research records.

## Verifiable counts

| Item | Records |
| --- | ---: |
| Source posts | 3,160 |
| Unique posts | 3,153 |
| Marked as duplicate and excluded from analysis | 7 |
| Current interaction-analysis sample | 2,048 |
| Source comments | 1,277 |
| Healthcare posts | 195 |
| Healthcare interaction-analysis posts | 81 |
| Finance and insurance posts | 107 |
| Finance and insurance interaction-analysis posts | 103 |
| Finance and insurance linked comments | 65 |
| Public-sector/non-profit posts | 67 |
| Public-sector/non-profit interaction-analysis posts | 22 |
| Public-sector/non-profit linked comments | 49 |
| Comments with empty text, retained | 5 |
| Comments not linked to a source post, retained | 12 |
| All posts missing a usable URL | 1,123 |
| Unique posts missing a usable URL | 1,121 |
| All posts missing likes | 956 |
| All posts missing comment counts | 1,086 |
| All posts missing reposts | 1,268 |
| Posts with a usable observation interval | 3,142 |
| Records missing the observation interval | 18 |

Another 49 quarantined records came from the original project's quarantine notes. They are not in the master CSVs and are outside the denominators above. Missing numbers are represented as JSON `null`; genuine zeros remain `0`. The working snapshot contains 3,160 posts and 1,277 comments. The public-sector source contained 95 raw rows and 68 text-unique rows. Of these, 67 had confirmed LinkedIn post IDs from which a past-month publication time could be derived; 66 were added and one was a text duplicate. Another 49 linked comments were added. One record without a source ID and verifiable publication time was excluded. For LI00030, the source `post_time` is one day later than `collected_at`; both `publishedAt` and `ageDays` are left blank, and `ageSource` is `missing`. Conflicting source dates are not replaced with guesses.

## `posts` fields

| Field | Type | Definition |
| --- | --- | --- |
| `id` / `sourceId` | string | Original `post_id`; the two fields are identical in the frozen sample. This is not an author identity. |
| `url` | string / null | Source LinkedIn post URL. Only HTTPS LinkedIn post paths are accepted, with query parameters removed. A total of 1,123 records currently lack a usable link; no URL is invented. |
| `text` | string | Deidentified version of the complete source `post_text`, with whitespace normalized and no truncation. No author fields are exposed. |
| `jobFamily` | string | One of 16 research categories. Recognised industry codes and industry keywords take priority; remaining records use job-function terms and post-text rules. |
| `publishedAt` | ISO date / null | Parseable date from CSV `post_time`. Relative time labels are not emitted as exact dates. |
| `collectedAt` | ISO date or datetime / null | CSV `collected_at`, preserving the source's date or time precision and time zone. |
| `ageDays` | number / null | Time from publication to capture, in days. Exact source dates use calendar-day differences; approximate publication dates exported from relative labels are also used to calculate collection-time age. This is not the time from publication to today. |
| `likes` / `commentsCount` / `reposts` | number / null | CSV `likes_count`, `comments_count` and `shares_count`: visible engagement counts. |
| `keyword` | string / null | Search keyword. |
| `isDuplicate` | boolean | CSV `is_duplicate_master`. The record remains stored; `true` records are excluded from analysis. |
| `analysisEligible` | boolean | Nonduplicate; original source text at least 80 characters; likes and comments both present; and not part of a quarantined record. This reproduces the original 1,318-record rule. Deidentification does not change this frozen flag. |
| `provenance` | string | Fixed value `baseline`. |
| `reviewStatus` | string | Fixed value `approved`, meaning included in the frozen export. It does not mean every text was manually verified. |
| `ageSource` | string | `exact`: absolute CSV date; `relative`: approximate label; `missing`: interval cannot be calculated. |

The 16 `jobFamily` groups are Engineering and technology, Product and project management, Design, Marketing and sales, Recruiting and HR, Healthcare, Hospitality, Operations and administration, Other or unclassified, Finance and insurance, Education and training, Manufacturing and industrial production, Retail and e-commerce, Logistics and transportation, Public sector and non-profit, and Architecture, real estate and construction. Industry codes take priority over job-function wording. These are derived research categories, not certified occupational labels.

## `comments` fields

| Field | Type | Definition |
| --- | --- | --- |
| `id` / `sourceId` | string | Source `comment_id`; identical in the frozen sample. |
| `postId` | string / null | Source `post_id`, linked to `posts.id`. Twelve source rows are blank and remain `null`; links are not guessed. |
| `text` | string | Deidentified version of the complete `comment_body`, with whitespace normalized. Originally empty text remains an empty string. |
| `collectedAt` | ISO date or datetime / null | The comment source table has no collection timestamp. Linked comments inherit the corresponding post's `collectedAt` as a capture time; unlinked comments remain `null`. This is not the comment publication time. |
| `provenance` / `reviewStatus` | string | Fixed `baseline` / `approved`, with the same meaning as in `posts`. |
| `textEmpty` | boolean | Explicit flag for empty text. Five rows are `true`; the record-count difference is retained when empty text is excluded from text-theme and length denominators. |

## Deidentification and limits

Author and commenter fields, raw page text, company-name fields and source-machine paths are not public. Known author or commenter names, email addresses, external links, phone-number candidates and contact accounts in text are replaced with markers such as `[name hidden]`, `[email hidden]`, `[link hidden]`, `[phone hidden]` and `[contact hidden]`. Only the `url` field retains usable LinkedIn source-post URLs. The phone rule avoids removing numbers with currency symbols, salary units or common salary ranges.

These records form a convenience sample. Likes and comments are not applicant counts, hiring outcomes, reach or causal effects. Publication intervals, roles and search lanes differ and can confound comparisons. Comment exports cover only the visible layer that was captured and are not the platform's total comment count. Automated classification and deidentification introduce coding error. Missing URLs and unlinked comments remain in the data and are reported in `meta.quality`.

Exports retain all text supplied by the CSV and do not truncate it further. The source-page capture itself may contain only a visible excerpt ending in “more”.

The six text signals in this version are recalculated in the browser from the complete deidentified post text under the current rules; they do not reuse the earlier five-signal aggregates. A link in the text does not by itself prove that an application route works. Rule matches still require manual review. `analysisEligible` preserves the original sample definition so the 1,318-record denominator can be checked.

## File consistency and reproduction

`baseline.json` and `baseline.js` contain the same object; the latter assigns it to `globalThis.APP_BASELINE`, allowing local browser use. `meta.fields` lists the actual fields. `meta.sourceFiles` stores SHA-256 hashes for every imported source CSV. `meta.dataHash` stores a SHA-256 value for the sorted key and compact UTF-8 JSON representation of the deidentified posts/comments, excluding `meta` to avoid a circular hash. `meta.hashes` also exposes the three hashes under stable `postsSource`, `commentsSource` and `records` keys. The scripts contain no values that change by runtime, so the same inputs and rules produce the same snapshot.

Data-record hash: `23b4bc06501fbcb433a39df0862fce666ff57dc19cbe86aada1689989b4c8573`.

The blank import templates use exactly the field names above. New records need a separate provenance value and a unique ID; unknown numbers remain blank and must not be replaced with `0`; relative dates must not be presented as exact publication dates. Exclusion flags and source counts in the original frozen sample should be retained.
