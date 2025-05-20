import express from "express";
import { Task } from "./task-model.js";
import mongoose from 'mongoose';

const router = express.Router();
const BASE_PATH = "/api/tasks";

router
  .route(BASE_PATH)
    // find all with pagination
    .get(async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            const filter = {};
            if (req.query.projectId) {
                filter.projectId = req.query.projectId;
            }

            const [tasks, total] = await Promise.all([
                Task.find(filter).skip(skip).limit(limit).lean(),
                Task.countDocuments(filter)
            ]);

            res.send({ tasks, total });
        } catch (err) {
            next(err);
        }
    })
    // create new
    .post((req, res, next) => {
        try {
            const { description, dueDate, state, notes, projectId } = req.body;

            const taskData = {
                description,
                state,
                notes,
                dueDate: new Date(dueDate), // convert to Date object
                projectId: new mongoose.Types.ObjectId(projectId), // convert to ObjectId
            };

            Task.create(taskData)
                .then((task) => res.send(task))
                .catch(next);
        } catch (err) {
            next(err);
        }
    });

router
  .route(`${BASE_PATH}/search`)
  // search
  .post((req, res, next) => {
    Task.find(req.body)
      .lean()
      .then((tasks) => res.send(tasks))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/:id`)
  // get one
  .get((req, res, next) => {
    Task.findById(req.params.id)
      .lean()
      .orFail()
      .then((task) => res.send(task))
      .catch(next);
  })
  // update
  .put((req, res, next) => {
    Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .lean()
      .orFail()
      .then((task) => res.send(task))
      .catch(next);
  })
  // delete
  .delete((req, res, next) => {
    Task.findByIdAndDelete(req.params.id)
      .lean()
      .orFail()
      .then(() => res.send(req.params))
      .catch(next);
  });

export default router;
