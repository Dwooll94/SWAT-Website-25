# Event Mode

## Description
This will use The Blue Alliance (thebluealliance.com) read APIs (v3) and webhooks to add a live event component to the home page when a configured FRC team is competing. This will be used as an easy place to send people associated with the team when they are looking for a stream of our events. It may also be used as a display in our pit with valuable information for us as we compete.

## Component Goals
- Only display when there is an active event.
- Embed the stream into the component.
- During Qualifications, Display the team's current rank
- Display the team's win-loss record
- Display the team's current OPR (Offensive Power Ranking)
- During Qualifications, Display the team's average ranking points at the competition, with an interval to the 1st ranked team at the event's average ranking points in red. The formatting on this should automatically change colors based on the current rank of the team relative to the size of the field. If the team is in 1st place, show the interval to the 2nd place team's ranking in green. This is the "qual_average" in the event statuses.
- Display the team's next match info (Match number, alliances, predicted score, time until match)
- During qualifications, display the after-match turnaround time (time between next match and the match after that for the team)
    -Example if it's currently match 32 and team 1806's next two matches 34 and 42, this would be the estimated start time of match 42 minus the estimated start time of match 34.
    - This should have a red or blue circle next to it in the color of the alliance the team will be in in the match after the next one. (in the previous example, the alliance 1806 is on in match 42) 
- Display the team's most recent match at the event (alliance, score, and ranking points earned)
- After alliance selection, display which alliance the team is on.
- Have an expandable sidebar to display the team's full match schedule with estimated times and predictions (if available).

## Notes
- Ranking points for individual matches is contained in the "rp" item in Match_Score_Breakdown_<YEAR>_Alliance object. This shouldn't change in future years other than needing the year for the game being played. 
- the team_key for a given team is just "frc<teamNumber>" ex: "frc1806"
- If the team ever advances to Einstein there may be 2 "events" going on at once, the event code for Einstein is YYYYcmpSS where YYYY is the current year, and SS is the location of the FIRST championship, EX: 2025cmptx . A team may show as on Einstein in the events list if they won an award there, but only switch the display to Einstein if we show as being on an alliance. Einstein field starts as a double elmination tournament between the winners of the divisions earlier that day.

## Flow
- The app will check the read API once every 24 hours for upcoming events for the configured team
- If there is an event for the configured team today, check every hour for a match schedule, and a stream link. If there is a live stream but no quals match schedule, it's probably practice day. 
- The app will recieve webhook callbacks from TBA's webhook api for the configured team's Upcoming matches, match scores, and alliance selection postings that the app can rely on for triggering recalculations/reloading of relevant data.

## Configuration
- Will need to be able to configure the X-TBA-AUth-Key, which needs to be stored securely
- Will need to be able to configure a webhook secret 
- Configure FRC Team Number, in case other teams want to use our website code, or for testing.
