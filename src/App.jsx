import React, { useState, useEffect } from "react";

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
  const [travelTimeMetrics, setTravelTimeMetrics] = useState({
    total: 0,
    between: 0,
  });

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
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [recentlyBookedRooms]);

  const getHorizontalPosition = (roomNumber) => {
    if (roomNumber >= 1000) {
      return roomNumber - 1000;
    }
    return roomNumber % 100 === 0 ? 10 : roomNumber % 100;
  };

  const getFloor = (roomNumber) => {
    return roomNumber >= 1000 ? 10 : Math.floor(roomNumber / 100);
  };

  // start

  const calculateTotalTravel = (roomList) => {
    if (roomList.length <= 1) return 0;

    let totalTime = 0;
    let currentFloor = -1;

    roomList.forEach((room, index) => {
      const floor = getFloor(room);

      if (floor !== currentFloor) {
        // If we had a previous floor, calculate distance to elevator and vertical travel
        if (currentFloor !== -1) {
          // Calculate horizontal time from previous room to elevator
          const prevRoom = roomList[index - 1];
          const horizontalTime = getHorizontalPosition(prevRoom);
          totalTime += horizontalTime;

          // Add vertical travel time
          const verticalTime = 2 * Math.abs(floor - currentFloor);
          totalTime += verticalTime;

          // Add horizontal time from elevator to new room
          totalTime += getHorizontalPosition(room);
        } else {
          // First room - just add distance from elevator
          totalTime += getHorizontalPosition(room);
        }

        currentFloor = floor;
      } else {
        // Same floor - add horizontal distance from previous room
        if (index > 0) {
          const prevRoom = roomList[index - 1];
          totalTime += Math.abs(
            getHorizontalPosition(room) - getHorizontalPosition(prevRoom)
          );
        }
      }
    });

    // Add final return to elevator if more than one floor was visited
    if (roomList.length > 1 && new Set(roomList.map(getFloor)).size > 1) {
      totalTime += getHorizontalPosition(roomList[roomList.length - 1]);
    }

    return totalTime;
  };

  const findOptimalRooms = (numRoomsRequested) => {
    // Try same floor first (greedy approach)
    for (let floor = 1; floor <= 10; floor++) {
      const availableRooms = getAvailableRooms(floor);
      if (availableRooms.length >= numRoomsRequested) {
        return availableRooms.slice(0, numRoomsRequested);
      }
    }

    // If no single floor solution, try combinations
    const allAvailable = getAllAvailableRooms();
    const combinations = getCombinations(allAvailable, numRoomsRequested);

    let bestBooking = null;
    let minTravelTime = Infinity;
    let minTotalTravel = Infinity;

    combinations.forEach((combination) => {
      const travelTime = calculateTravelTime(
        combination[0],
        combination[combination.length - 1]
      );
      const totalTravel = calculateTotalTravel(combination);

      if (travelTime < minTravelTime) {
        // Found better travel time - update all metrics
        minTravelTime = travelTime;
        minTotalTravel = totalTravel;
        bestBooking = combination;
      } else if (travelTime === minTravelTime) {
        // Same travel time - check total travel for tie-breaking
        if (totalTravel < minTotalTravel) {
          minTotalTravel = totalTravel;
          bestBooking = combination;
        }
      }
    });

    return bestBooking;
  };

  const handleBook = () => {
    const roomCount = parseInt(numberOfRooms);
    if (!roomCount || roomCount < 1 || roomCount > 5) {
      alert("Please enter a valid number of rooms (1-5)");
      return;
    }

    const optimalRooms = findOptimalRooms(roomCount);
    if (!optimalRooms || optimalRooms.length < roomCount) {
      alert("Not enough rooms available");
      return;
    }

    // Calculate metrics for optimal booking
    const maxTravelTime = calculateTravelTime(
      optimalRooms[0],
      optimalRooms[optimalRooms.length - 1]
    );
    const totalTravelTime = calculateTotalTravel(optimalRooms);

    setTravelTimeMetrics({
      between: maxTravelTime,
      total: totalTravelTime,
    });

    setRooms((prevRooms) => {
      const newRooms = { ...prevRooms };
      optimalRooms.forEach((roomNumber) => {
        newRooms[roomNumber].status = "highlighted";
      });
      return newRooms;
    });

    setRecentlyBookedRooms(optimalRooms);
    setNumberOfRooms("");
  };

  // end

  const calculateTravelTime = (firstRoom, lastRoom) => {
    const firstFloor = getFloor(firstRoom);
    const lastFloor = getFloor(lastRoom);

    if (firstFloor !== lastFloor) {
      const fh = getHorizontalPosition(firstRoom);
      const lh = getHorizontalPosition(lastRoom);
      return fh + 2 * Math.abs(firstFloor - lastFloor) + lh;
    }
    return Math.abs(
      getHorizontalPosition(lastRoom) - getHorizontalPosition(firstRoom)
    );
  };

  const getAvailableRooms = (floor) => {
    const available = [];
    const start = floor === 10 ? 1001 : floor * 100 + 1;
    const end = floor === 10 ? 1007 : floor * 100 + 10;

    for (let roomNumber = start; roomNumber <= end; roomNumber++) {
      if (rooms[roomNumber].status === "empty") {
        available.push(roomNumber);
      }
    }
    return available;
  };

  const getAllAvailableRooms = () => {
    let available = [];
    for (let floor = 1; floor <= 10; floor++) {
      available = [...available, ...getAvailableRooms(floor)];
    }
    return available;
  };

  const getCombinations = (arr, size) => {
    if (size === 1) return arr.map((value) => [value]);

    const combinations = [];
    for (let i = 0; i <= arr.length - size; i++) {
      const current = arr[i];
      const subCombinations = getCombinations(arr.slice(i + 1), size - 1);
      subCombinations.forEach((subComb) =>
        combinations.push([current, ...subComb])
      );
    }
    return combinations;
  };

  const handleRandom = () => {
    const roomCount = Math.floor(Math.random() * 11) + 5;
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

  const handleReset = () => {
    setRooms(initializeHotelState());
    setNumberOfRooms("");
    setRecentlyBookedRooms([]);
    setTravelTimeMetrics({ total: 0, between: 0 });
  };

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
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="number"
          min="1"
          max="5"
          value={numberOfRooms}
          onChange={(e) => setNumberOfRooms(e.target.value)}
          placeholder="Rooms"
          className="border p-2 rounded w-24"
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
        {showTravelTime && (
          <div className="ml-4 text-green-500 font-bold">
            Travel travel time: {travelTimeMetrics.between} mins || Combined
            vertical & horizontal travel time: {travelTimeMetrics.total} mins
          </div>
        )}
      </div>

      <div className="grid grid-cols-11 gap-2">
        {Array.from({ length: 10 }, (_, floor) => {
          const currentFloor = 10 - floor;
          return (
            <React.Fragment key={currentFloor}>
              {floor === 0 && (
                <div
                  className="bg-gray-300 row-span-10 flex items-center justify-center p-2 text-sm"
                  style={{ gridRow: "1 / span 10" }}
                >
                  <div className="rotate-270 whitespace-nowrap">
                    Elevator & Stairs
                  </div>
                </div>
              )}

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

              {currentFloor === 10 &&
                Array.from({ length: 3 }, (_, i) => (
                  <div key={`empty-${i}`} className="invisible" />
                ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default App;
