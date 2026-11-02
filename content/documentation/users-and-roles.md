---
title: Users and roles
description: Add people to the site, give each a role, and see what every role may do.
order: 4
---

Everyone who signs in to the site has an account with one **role**. The role decides what they
may do, through **capabilities**: "Manage products", "Change settings", "Use the admin". These
screens need the **Add users and change roles** capability (`core.manage_users`).

## The roles

Every site has these, as WordPress does:

| Role              | What it's for                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Administrator** | Everything, on every screen, including what plugins add.                                                                |
| **Editor**        | Every post and page, anyone's, and every file in the media library.                                                     |
| **Author**        | Their own posts, which they publish, and the files they upload.                                                         |
| **Contributor**   | Their own posts, sent for review; no uploads.                                                                           |
| **Customer**      | People who sign in to the site itself, such as a shop's buyers. No admin access. People who sign up on the site get it. |

Plugins add their own. Commerce adds **Shop manager**, who can use the admin to manage products,
orders and the shop's settings, but not plugins, users or the site's settings.

**Users › Roles** lists every role on the site with its capabilities. Roles come from the active
plugins: deactivate a plugin and the roles and capabilities it added go with it, and come back when
it's activated again.

## Adding a user

**Users › Add User** creates an account:

- **Email** (required): what they sign in with.
- **Name**: how the admin greets them.
- **Password** (required): at least 10 characters. Send it to them in a safe way; they can't
  change it themselves yet.
- **Role**.

## Editing a user

Click a user's email address in **Users** to edit them, as WordPress's Edit User screen does:

- **Role**, **Name** and **Email**. A new address takes effect at once; the old one gets an email
  saying so, and the new one counts as unconfirmed until the person uses a link sent to it.
- The fields plugins add, such as a student's level.
- **Send Reset Link** emails them a link to set a new password.
- **Log Out Everywhere** signs them out on every device.

## Your profile

**Users › Profile**, or **Edit Profile** under **Howdy** in the admin bar, is everyone's own:
your name, the fields plugins give you, your email address (changed once a link sent to the new
one is used), your password, and **Log Out Everywhere Else**, for a device you left signed in.

## Changing roles

**Users › All Users** lists everyone. The links above the list filter it by role. To change roles,
tick the people, choose the new role under **Change role to…**, and click **Change**. It changes
all of them or none: if one can't change, nothing does, and the message says why.

The site always keeps at least one administrator: the last one can't be given another role.

## Who can update the site

Updating the CMS and plugins needs **Update the CMS and plugins** (`core.manage_updates`). Only
administrators have it, because an update rebuilds the site; a developer can grant it to another
role in a plugin.
