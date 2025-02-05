package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	gt7 "github.com/snipem/go-gt7-telemetry/lib"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins
}

var (
	ps5_ip       string
	gt7c         *gt7.GT7Communication
	gt7cMutex    sync.Mutex // Protect concurrent access to gt7c
	activeWsConn []*websocket.Conn
)

func main() {
	// WebSocket handler
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// Wait until the PS5 IP is set (i.e., not empty)
		if ps5_ip == "" {
			http.Error(w, "PS5 IP is not configured yet", http.StatusServiceUnavailable)
			return
		}

		// Upgrade the connection to WebSocket
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			fmt.Println("WebSocket Upgrade Error:", err)
			return
		}
		defer conn.Close()

		// Lock for safe access to active connections
		gt7cMutex.Lock()
		activeWsConn = append(activeWsConn, conn)
		gt7cMutex.Unlock()

		// Send the entire LastData every 1ms
		for {
			err := conn.WriteJSON(gt7c.LastData)
			if err != nil {
				fmt.Println("WebSocket Write Error:", err)
				break
			}
			time.Sleep(10 * time.Millisecond) // High-frequency updates
		}

		// Remove the connection after it's closed
		gt7cMutex.Lock()
		for i, c := range activeWsConn {
			if c == conn {
				activeWsConn = append(activeWsConn[:i], activeWsConn[i+1:]...)
				break
			}
		}
		gt7cMutex.Unlock()
	})

	// Configure endpoint
	http.HandleFunc("/configure", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			var body struct {
				PS5IP string `json:"ps5_ip"`
			}
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				http.Error(w, "Invalid JSON", http.StatusBadRequest)
				return
			}

			if body.PS5IP != ps5_ip {
				fmt.Println("Received new PS5 IP:", body.PS5IP)

				// Lock to safely stop and restart the GT7 communication
				gt7cMutex.Lock()

				// Stop previous communication if any
				if gt7c != nil {
					gt7c.Stop() // You need to add a Stop method in the gt7c struct if not present
				}

				// Update the PS5 IP and restart the communication
				ps5_ip = body.PS5IP
				gt7c = gt7.NewGT7Communication(ps5_ip)

				// Restart the communication
				go gt7c.Run()

				// Notify all active WebSocket connections with the new data
				for _, conn := range activeWsConn {
					// Sending a message that new data is available could be useful for clients
					conn.WriteJSON(map[string]string{"status": "PS5 IP updated"})
				}

				gt7cMutex.Unlock()
			}

			// Respond with success once IP is received
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]string{"status": "success"})
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	// Apply CORS middleware
	handler := cors.Default().Handler(http.DefaultServeMux)

	fmt.Println("WebSocket server running at ws://localhost:8080/ws")
	http.ListenAndServe(":8080", handler)
}
