# Skynet Abuse Skapp

## Description

This project was built to allow reporting abusive skylinks. 
It exposes a simple form that asks the user for:
- name
- email
- skylink
- tags

The form is sent to an API that persist the data in a database and will then go
on to block the reported skylink.


## Build Process

Run `yarn build` and update the `build` (as a) directory to Skynet.

## Skapp

Currently deployed here:
https://vg2epksr2mhaq1sjbfbqu6glpvp2ucuh1ebg502nirr9o87qqot6isg.siasky.net/ but
not hooked up to the API yet.
## TODOs

- [ ] use React bootstrap for the form
- [ ] hook up to API and testoof