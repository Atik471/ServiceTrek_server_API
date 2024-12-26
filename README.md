### ServiceTrek Server  

The **ServiceTrek Server** is the backend API for the ServiceTrek platform. It powers the service and review functionalities, manages user authentication with JWT, and interacts with the database (MongoDB). The server handles all CRUD operations for services and reviews, ensuring secure and efficient data flow.

---

### Features  

- **JWT Authentication**:  
  Secure authentication for protected routes using JSON Web Tokens (JWT).
  
- **Service Management**:  
  - Add, view, search, update, and delete services.  
  - Paginated and filtered service listing.  

- **Review Management**:  
  - Add, view, update, and delete reviews.  
  - View reviews for specific services or users.

- **Database**:  
  - MongoDB is used for managing data for services and reviews.  

- **Cookie-based Authentication**:  
  Implements HTTP-only cookies for securely storing tokens.  

---

### Live Demo  

You can access the **live version** of the ServiceTrek application here:  
👉 **[ServiceTrek Live Link](https://servicetrek-ff5f1.web.app)**  
👉 **[ServiceTrek Server](https://service-trek-server.vercel.app)**  
---

### API Endpoints  

Here’s a summary of the key API endpoints:

#### **Auth**  
- `POST /jwt`  
  Generate a JWT token for authenticated requests.

#### **Services**  
- `POST /services/add` (Protected)  
  Add a new service.  

- `GET /services`  
  Get a paginated list of all services.  

- `GET /services/:id`  
  View details of a specific service.  

- `PATCH /update-service/:id`  
  Update an existing service.  

- `DELETE /delete-service/:id`  
  Delete a service by its ID.  

#### **Reviews**  
- `POST /reviews/add` (Protected)  
  Add a review for a service.  

- `GET /reviews/:id`  
  Get reviews for a specific service.  

- `GET /my-reviews/:id` (Protected)  
  Get reviews added by a specific user.  

- `PATCH /update-review/:id`  
  Update an existing review.  

- `DELETE /delete-review/:id`  
  Delete a review by its ID.  

---

### Technologies  

#### **Backend**  
- **Node.js**: JavaScript runtime.  
- **Express.js**: Framework for building RESTful APIs.  
- **JWT**: Secure authentication.  
- **Cookie-Parser**: Handle HTTP-only cookies.  
- **dotenv**: Manage environment variables.  

#### **Database**  
- **MongoDB**: NoSQL database for services and reviews.
