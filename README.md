Mahlzeit is a twitter based tool to invite your friends to a lunch date

**How does it work?**

* Login with twitter
* Choose location, time and your friends
* Mahlzeit will automatically invite your friends via twitter direct message
* Your friends will get a link to view the lunchdate details and say if they will join you


## Concept

**Keep it Simple**

* We build the app with only one use case: Invite your friends to lunch.
* No restaurant recommendation, cause you and your friends know your typical lunch places.
* You can only invite for the actual day between 11:00 and 16:00.
* You can only invite your twitter followers cause we can easily use twitters DM to send invites.
* No iCal and outlook files, cause its just a lunch with your friends not a fucking company meeting.

##Technical stuff

* Fetching all followers when the user logs in for teh first time.
* Create an event in level DB
* send invites via twitter DM with personalized links to the event
* Invited people can join or decline on this side

## Left overs

* notify the owner of an event who has accept decline
* indicate wrong user input
