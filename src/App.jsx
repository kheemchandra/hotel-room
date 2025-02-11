import React, { useState, useEffect } from "react";

// Initialize hotel rooms data structure
const initializeHotelState = () => {
  const rooms = {};
  // Floors 1-9 with 10 rooms each
  for (let floor = 1; floor <= 9; floor++) {
    for (let room = 0; room < 10; room++) {
      const roomNumber = floor * 100 + (room + 1);
      rooms[roomNumber] = {
        status: "empty",
        floor,
        position: room + 1,
      };
    }
  }
  // Floor 10 with 7 rooms
  for (let room = 0; room < 7; room++) {
    const roomNumber = 1000 + (room + 1);
    rooms[roomNumber] = {
      status: "empty",
      floor: 10,
      position: room + 1,
    };
  }
  return rooms;
};

const App = () => {
  const [rooms, setRooms] = useState(initializeHotelState());
  const [numberOfRooms, setNumberOfRooms] = useState("");
  const [recentlyBookedRooms, setRecentlyBookedRooms] = useState([]);
  const [showTravelTime, setShowTravelTime] = useState(false);

  // Reset highlight effect after delay
  useEffect(() => {
    if (recentlyBookedRooms.length > 0) {
      setShowTravelTime(true);
      const timer = setTimeout(() => {
        setRooms((prevRooms) => {
          const newRooms = { ...prevRooms };
          recentlyBookedRooms.forEach((roomNumber) => {
            newRooms[roomNumber].status = "booked";
          });
          return newRooms;
        });
        setRecentlyBookedRooms([]);
        setShowTravelTime(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [recentlyBookedRooms]);

  // Find available rooms for booking
  const findAvailableRooms = (count) => {
    const available = [];
    const allRoomNumbers = Object.keys(rooms);

    // Try to find consecutive rooms first
    for (let i = 0; i < allRoomNumbers.length - count + 1; i++) {
      const consecutive = allRoomNumbers.slice(i, i + count);
      if (
        consecutive.every(
          (roomNumber) =>
            rooms[roomNumber].status === "empty" &&
            consecutive[0].slice(0, -1) === roomNumber.slice(0, -1)
        )
      ) {
        return consecutive;
      }
    }

    // If consecutive rooms not found, get any available rooms
    for (const roomNumber of allRoomNumbers) {
      if (rooms[roomNumber].status === "empty") {
        available.push(roomNumber);
        if (available.length === count) break;
      }
    }

    return available.length >= count ? available.slice(0, count) : [];
  };

  // Handle room booking
  const handleBook = () => {
    const roomCount = parseInt(numberOfRooms);
    if (!roomCount || roomCount < 1 || roomCount > 5) {
      alert("Please enter a valid number of rooms (1-5)");
      return;
    }

    const availableRooms = findAvailableRooms(roomCount);
    if (availableRooms.length < roomCount) {
      alert("Not enough rooms available");
      return;
    }

    setRooms((prevRooms) => {
      const newRooms = { ...prevRooms };
      availableRooms.forEach((roomNumber) => {
        newRooms[roomNumber].status = "highlighted";
      });
      return newRooms;
    });
    setRecentlyBookedRooms(availableRooms);
    setNumberOfRooms("");
  };

  // Handle random room filling
  const handleRandom = () => {
    const roomCount = Math.floor(Math.random() * 40) + 20; // Fill 20-60 rooms
    const availableRoomNumbers = Object.keys(rooms).filter(
      (roomNumber) => rooms[roomNumber].status === "empty"
    );

    const randomRooms = [...availableRoomNumbers]
      .sort(() => Math.random() - 0.5)
      .slice(0, roomCount);

    setRooms((prevRooms) => {
      const newRooms = { ...prevRooms };
      randomRooms.forEach((roomNumber) => {
        newRooms[roomNumber].status = "booked";
      });
      return newRooms;
    });
  };

  // Handle reset
  const handleReset = () => {
    setRooms(initializeHotelState());
    setNumberOfRooms("");
    setRecentlyBookedRooms([]);
  };

  // Get color based on room status
  const getRoomColor = (status) => {
    switch (status) {
      case "empty":
        return "bg-gray-100";
      case "booked":
        return "bg-gray-500";
      case "highlighted":
        return "bg-green-400";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Control Panel */}
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="number"
          min="1"
          max="5"
          value={numberOfRooms}
          onChange={(e) => setNumberOfRooms(e.target.value)}
          placeholder="Rooms"
          className="border p-2 rounded"
        />
        <button
          onClick={handleBook}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Book
        </button>
        <button
          onClick={handleReset}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Reset
        </button>
        <button
          onClick={handleRandom}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Random
        </button>
        {/* Travel Time Message */}
        {showTravelTime && (
          <div className="ml-4 text-green-500 font-bold">
            Total travel time = 5 minutes
          </div>
        )}
      </div>

      {/* Hotel Grid - Updated Layout */}
      <div className="grid grid-cols-11 gap-2">
        {Array.from({ length: 10 }, (_, floor) => {
          const currentFloor = 10 - floor;
          return (
            <React.Fragment key={currentFloor}>
              {/* Elevator vertical strip */}
              {floor === 0 ? (
                <div
                  className="bg-gray-300 row-span-10 flex items-center justify-center p-2 text-sm"
                  style={{ gridRow: "1 / span 10" }}
                >
                  <div className="rotate-270 whitespace-nowrap">
                    Elevator & Stairs
                  </div>
                </div>
              ) : null}

              {/* Rooms for current floor */}
              {Array.from(
                { length: currentFloor === 10 ? 7 : 10 },
                (_, room) => {
                  const roomNumber = currentFloor * 100 + (room + 1);
                  const roomData = rooms[roomNumber];

                  return (
                    <div
                      key={roomNumber}
                      className={`
                      ${getRoomColor(roomData.status)}
                      p-2 text-center border rounded
                      transition-colors duration-300
                      hover:opacity-80
                    `}
                    >
                      {roomNumber}
                    </div>
                  );
                }
              )}

              {/* Add empty cells for top floor to maintain grid */}
              {currentFloor === 10 &&
                Array.from({ length: 3 }, (_, i) => (
                  <div key={`empty-${i}`} className="invisible"></div>
                ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default App;
