
import express from "express";
const searchRoute = express.Router()
import {getSearch} from "../controllers/searchController.js"

searchRoute.get("/api/products", getSearch )

export {searchRoute}
