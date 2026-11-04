---
title: Courses
description: Teach courses on your site with lessons in order, free enrollment or sales through the shop, learners' progress, and instructors who write their own courses.
order: 8.5
---

The **Courses** plugin turns a site into a school, as LearnDash or LifterLMS does in WordPress:
courses made of lessons, learners who enroll and work through them, and instructors who write
their own. With [Commerce](/documentation/plugins) active, courses can be sold in the shop.

## Installing it

```bash
npm install @otwdesign/plugin-lms
```

Add `"@otwdesign/plugin-lms"` to `cms.config.json`, rebuild, and activate **Courses** on the Plugins
screen. To sell courses, have Commerce installed and active too; Courses works without it, for
free courses.

## Courses and lessons

**Courses › All Courses** and **Courses › All Lessons** list them, as Posts lists posts, with
the same edit screen: title, editor, Excerpt (courses), Featured image (courses) and the Publish
box.

- **A course's Course settings box** says who may take it (below), its price for a paid course,
  and whether **lessons open in order**: on, as by default, each lesson opens once the one before
  it is done.
- **A lesson's Course box** says which course it's in. A lesson joining a course goes last; its
  **Order** (in Lesson Attributes) moves it, and lessons with the same Order follow the order they
  were written in. Tick **Sample lesson** and anyone can open it, enrolled or not, as a preview.
- **A course's Lessons box** lists its lessons in order, drafts included, with a link to each.

Only published lessons are part of a course on the site. The course list shows each course's
**Lessons**, **Students** and **Access**; **Students** opens its learners (below).

## Who may take a course

| Access     | What learners do                                                               |
| ---------- | ------------------------------------------------------------------------------ |
| **Open**   | Anyone reads the lessons, signed in or not. Signed in, their progress is kept. |
| **Free**   | They sign in and click **Enroll for free**.                                    |
| **Paid**   | They sign in and buy the course; paying the order enrolls them.                |
| **Closed** | Only people enrolled by hand, on the **Students** screen.                      |

A paid course with no price, or while Commerce is inactive, takes no one new, as a closed one.
Learners already enrolled keep their courses whatever happens to the access.

## On the site

| Address                              | What it shows                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `/courses`                           | The published courses, newest first, a page at a time (Settings › Reading's number) |
| `/courses/{course}`                  | The course: its description, what it offers you, and its lessons                    |
| `/courses/{course}/lessons/{lesson}` | A lesson, or why it won't open                                                      |
| `/my-courses`                        | The signed-in learner's courses, with their progress                                |
| `/courses/preview/{id}`              | An unpublished course or lesson, for those who may read it                          |

The course page offers each person what they can do: **Sign in to enroll** (or **Sign in to buy**,
which brings them back afterwards), **Enroll for free**, **Buy for $49.00** with the shop's payment
methods, or **Start the course** and **Continue** with their progress once they're in. A lesson
they can't open shows its title and why: sign in, enroll, finish the lessons before it, or the
course takes no one new. Its text is never sent to them.

Lessons end with **Mark complete**, which goes on to the next lesson. The last one completes the
course, and the course page then says when. The main navigation links to **Courses**, and the
[account page](/documentation/accounts) gets a **Courses** section with the learner's latest
courses and a link to `/my-courses`.

Courses and lessons are previewed from the list's **Preview** link and the lesson's Course box:
an unpublished one has no address yet.

A site moves these pages with `routes` in `cms.config.json`, as for any plugin page:
`lms.courses`, `lms.course`, `lms.lesson`, `lms.my-courses` and `lms.preview`. For example,
`"routes": { "lms.course": "/learn/:slug", "lms.lesson": "/learn/:course/:lesson" }`. The pages
use plain markup with `lms-` class names, styled by the site's own stylesheet; see
[Layout and styles](/themes/layout-and-styles).

## Selling courses

> [!NOTE]
> Commerce isn't on npm yet, so for now courses are open, free or closed; paid courses wait for
> Commerce's release.

With Commerce active, a course set to **Paid** with a price is bought from its own page:

1. The learner signs in, chooses how to pay, and clicks **Buy**. Commerce places the order with
   their account's email and, for a card, sends them to the payment page.
2. When the order is paid (by the payment provider, or **Mark as paid** for "Pay later"), they're
   enrolled. A payment confirmed twice enrolls them once.

Courses can't be bought signed out, or through Commerce's own checkout: every order with a course
says whose account it enrolls. People new to the site register first, which needs
**Settings › General › Membership › Anyone can register** and a mail plugin.

Commerce's screens show the courses too:

- **An order's screen** has a **Courses** box: which courses it bought, for whom, and whether
  they're enrolled.
- **Commerce › Course sales** lists every course sold, with its order, learner, amount and status,
  for people who manage orders.

## Students

**Courses › Students** lists the courses you teach; open one for its learners: how they enrolled
(for free, bought, by hand, or by opening an open course), when, and their progress. Above the
list, **Enroll by email address** enrolls someone with an account on the site, and **Remove**
takes a learner off the course. Their progress is kept, so enrolling them again picks up where
they left off.

## Instructors

The **Instructor** role writes courses and lessons, and uploads files, as an author writes posts:
their own only. They add lessons only to courses they teach, see only those courses' students,
and enroll people by hand except in paid courses, which take an editor.

By default instructors **submit for review**, as contributors do: an editor or administrator
publishes their courses and lessons. **Courses › Settings › Instructors publish without review**
lets them publish their own.

Editors and administrators have every course. They, and a course's instructor, open every lesson
of it without enrolling; their progress isn't kept.

## Good to know

- **Deleting a course** for good removes its enrollments, and its lines in Course sales; the orders
  stay in Commerce. Its lessons stay, without a course. Moving it to the Trash keeps everything.
- **Progress belongs to the lesson.** A lesson moved to another course counts as done there for
  those who completed it.
- **A lesson added to a finished course** doesn't take the course back from those who completed
  it.
- **Deactivating Courses** hides its screens and pages and keeps every course, lesson,
  enrollment and sale.

## For developers

The plugin's `lms` service enrolls people and reads progress, and its actions tell other plugins
when someone enrolls, completes a lesson or completes a course, inside the same transaction. A
certificates plugin, for example:

```ts filename="src/index.ts"
import { definePlugin } from '@otwdesign/sdk'
import type {} from '@otwdesign/plugin-lms'

export default definePlugin({
  id: 'certificates',
  version: '1.0.0',
  requires: { core: '^1.0.0', lms: '^1.0.0' },
  setup(cms) {
    cms.hooks.addAction('lms.course.completed', async ({ enrollment, course }) => {
      const learner = await cms.users.get(enrollment.userId)
      if (!learner) return
      await cms.mail.send({
        to: learner.email,
        subject: `Your certificate for ${course.title}`,
        text: `Congratulations: you completed ${course.title}.`,
      })
    })
  },
})
```

Its meta capabilities, `lms.teach_course` and `lms.enroll_students`, take a course and can be
adjusted with `cms.auth.extendCapability()`, as any plugin's can: a plugin for co-instructors could
let a course's other teachers in. The [Code Reference](/reference) lists them all.
