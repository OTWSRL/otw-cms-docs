---
title: Accounts on the site
description: Let people sign up on the site, sign in, reset a lost password and change their details at /account, as WordPress's sign-in page and WooCommerce's My Account do.
order: 4.5
---

**/account** is where people who use the site, rather than run it, manage their account: a shop's
customers, a course's students. It's WooCommerce's My Account. Signed out, it shows **Sign in**,
and **Register** when the site takes sign-ups; signed in, the account's details.

## Letting people sign up

Sign-ups are off until you tick **Anyone can register** under **Settings › General › Membership**,
as in WordPress. They also need a mail plugin, since every sign-up is confirmed by email: without
one, the Register form doesn't show.

Someone who signs up gives their name and email address, and gets an email with a link to set
their password. The account works once they use it, so every account's address is one its owner
reads. New accounts get the **Customer** role: no admin access.

## Signing in

People sign in at **/account** with their email address and password. Five wrong passwords in a
row lock the address for 15 minutes. Someone who signs in at the admin's sign-in page but may not
use the admin, such as a customer, lands on their account instead.

## A lost password

**Lost your password?**, on the account page and on the admin's sign-in page, asks for an email
address and emails it a link to set a new password. The link works once, for 24 hours. Setting the
password signs out every session the account had, everywhere, and signs in where the link was
used.

The forms never say whether an account uses an address, so they can't be used to find out who has
one: the email does, to its owner. An address gets three emails an hour at most from these forms.

## The account page

Signed in, **/account** has:

- **Your details**: your name, and any fields plugins add, such as a newsletter choice.
- **Email address**, changed in two steps: enter the new address and your password, then use the
  link emailed to the new address. Until then nothing changes, and when it does, the old address
  is told.
- **Password**: your current one, then the new one. Your other sessions are signed out, and the
  account's address gets an email saying the password changed.
- **Sign out**, and **Go to the admin** for those who may use it.

Plugins add sections after it, too. A shop adds **Orders**, the orders placed with the account's address. They
show once the address is confirmed, since anyone can type an address at checkout: an account
made by signing up is confirmed already, and one an administrator added confirms by setting a
new password from **Lost your password?**.
