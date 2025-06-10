// Flights module
const FlightsModule = {
  elements: {
    tripType: document.getElementById("tripType"),
    passengers: document.getElementById("passengers"),
    fromAirport: document.getElementById("fromAirport"),
    toAirport: document.getElementById("toAirport"),
    departDate: document.getElementById("departDate"),
    returnDate: document.getElementById("returnDate"),
    returnDateGroup: document.getElementById("returnDateGroup"),
    searchFlightsBtn: document.getElementById("searchFlightsBtn"),
    flightResults: document.getElementById("flightResults"),
    flightsList: document.getElementById("flightsList"),
  },
}

function initFlights() {
  setupFlightsEventListeners()
  updateReturnDateVisibility()
}

function setupFlightsEventListeners() {
  FlightsModule.elements.searchFlightsBtn.addEventListener("click", searchFlights)

  FlightsModule.elements.tripType.addEventListener("change", updateReturnDateVisibility)
}

function updateReturnDateVisibility() {
  const isRoundTrip = FlightsModule.elements.tripType.value === "round-trip"
  FlightsModule.elements.returnDateGroup.style.display = isRoundTrip ? "block" : "none"
}

async function searchFlights() {
  const fromAirport = FlightsModule.elements.fromAirport.value.trim()
  const toAirport = FlightsModule.elements.toAirport.value.trim()
  const departDate = FlightsModule.elements.departDate.value

  if (!fromAirport || !toAirport || !departDate) {
    alert("Please fill in all required fields.")
    return
  }

  FlightsModule.elements.searchFlightsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching Flights...'
  FlightsModule.elements.searchFlightsBtn.disabled = true

  try {
    // Mock flight data - replace with real API
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockFlights = [
      {
        airline: "Korean Air",
        departure: "08:30",
        arrival: "14:45",
        duration: "6h 15m",
        price: 850,
        stops: 0,
      },
      {
        airline: "Asiana Airlines",
        departure: "11:20",
        arrival: "17:35",
        duration: "6h 15m",
        price: 780,
        stops: 0,
      },
      {
        airline: "United Airlines",
        departure: "15:45",
        arrival: "09:30+1",
        duration: "12h 45m",
        price: 650,
        stops: 1,
      },
      {
        airline: "Emirates",
        departure: "22:10",
        arrival: "16:25+1",
        duration: "13h 15m",
        price: 920,
        stops: 1,
      },
    ]

    displayFlightResults(mockFlights, fromAirport, toAirport)
  } catch (error) {
    console.error("Flight search error:", error)
    alert("Failed to search flights. Please try again.")
  } finally {
    FlightsModule.elements.searchFlightsBtn.innerHTML = '<i class="fas fa-search"></i> Search Flights'
    FlightsModule.elements.searchFlightsBtn.disabled = false
  }
}

function displayFlightResults(flights, fromAirport, toAirport) {
  FlightsModule.elements.flightsList.innerHTML = ""

  flights.forEach((flight) => {
    const flightItem = document.createElement("div")
    flightItem.className = "flight-item"
    flightItem.innerHTML = `
            <div class="flight-main">
                <div class="flight-route">
                    <div class="flight-time">
                        <div class="time">${flight.departure}</div>
                        <div class="location">${fromAirport}</div>
                    </div>
                    <div class="flight-duration">
                        <i class="fas fa-plane"></i>
                        <div class="duration">${flight.duration}</div>
                        ${flight.stops > 0 ? `<div class="stops">${flight.stops} stop${flight.stops > 1 ? "s" : ""}</div>` : ""}
                    </div>
                    <div class="flight-time">
                        <div class="time">${flight.arrival}</div>
                        <div class="location">${toAirport}</div>
                    </div>
                </div>
                <div class="flight-price">
                    <div class="price">$${flight.price}</div>
                    <div class="per-person">per person</div>
                </div>
            </div>
            <div class="flight-footer">
                <div class="flight-airline">${flight.airline}</div>
                <button class="select-flight-btn">Select Flight</button>
            </div>
        `

    FlightsModule.elements.flightsList.appendChild(flightItem)
  })

  FlightsModule.elements.flightResults.style.display = "block"
}
