# LVB Glossary

## Arrive by
A routing option indicating that the journey should arrive at the destination at the specified time.

## Autocomplete
API that provides an autocomplete to find stops, addresses and points of interest.

## Depart at
A routing option indicating that the journey should start at the specified time.

## Headsign
Destination of a certain trip of a route that indicates the direction in which the route is operated.

## Itinerary
- Has a point of departure and a point of arrival and happens at a specific time
- Consists of one or more legs

## Journey
- I want to travel from a point of departure to a point of arrival around a certain time
- I can specify additional customizations such as modes of transport or avoiding transfers
- Planning a journey results in itineraries

## Leg
A leg of an itinerary is a part that uses a certain mode of transport (incl. walking), it defines at which points to enter and exit a vehicle on a trip or when to start walking from and to a certain location.

## Mode of transport / Travel mode
The modes of transport that are relevant for public transport routing in Leipzig and the MDV are suburban trains (S-Bahn), local trains (Regionalzüge), trams and busses as well as walking.

## OTP
Open Trip Planner, routing algorithm used by LVB and available via an API.

## Planned Time
The scheduled departure or arrival time according to the timetable.

## Realtime
Updated departure or arrival times based on realtime operational data such as delays.

## Route
- Public Transport usually runs along a fixed route
- It has a route name and is associated with a certain mode of transport and a colour
- Several trips can follow a route
- Example: Route with name "4" in Leipzig is a tram and is coloured blue

## Routing API
An application programming interface that provides journey planning results (itineraries) based on given parameters such as start, destination, time, and travel modes.

## Shape
- Shapes describe the path that a vehicle travels along a route alignment
- Can be shown in a map

## Short-distance Trip
A journey classified as a short-distance trip according to tariff rules.

## Stop (parent and child)
- A location at which public transport vehicles stop to let passengers board/alight
- Can have one or several tracks
- Some stops are organized in stop parents and stop children
- Often, children have the exact same name as the parent, but have differing coordinates
- Sometimes specifies tracks
- Example: stop Augustusplatz - all tram routes have the same stop Augustusplatz, but in reality, there are 3 different locations in which vehicles can be (de)boarded. The 3 different locations are children of the same parent. OTP responses contain the exact child of the stop if available.

## Transfer
- When itinerary has multiple legs using public transport, switching from one vehicle to another one is called transfer
- Most of the time, a transfer is handled as a separate walking leg

## Transfer Scheme
A visual representation of an itinerary that shows its legs and transfers, including their sequence and relative duration.

## Trip
- A trip runs on a specific route with a certain origin and terminal station and starting on a certain time, following a certain stop sequence
- It has a tripID in the LVB system
- A tripID is not limited to a specific day but connected to a certain time and stop sequence
- It has a headsign and a shape
- Example: If I want to travel at 12.26h from Stallbaumstr. to Goerdelerring, I will have to take the Tram 4 in direction of Stötteritz that originated in Gohlis, Landsberger Straße at 12.15h.
