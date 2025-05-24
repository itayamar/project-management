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
                filter.projectId = new mongoose.Types.ObjectId(req.query.projectId);
            }

            const pipeline = [
                { $match: filter }
            ];

            const { sortField, sortOrder } = req.query;

            // Add sorting
            const allowedSortFields = ['dueDate', 'createdAt', 'updatedAt'];
            if (sortField && allowedSortFields.includes(sortField)) {
                pipeline.push({
                    $sort: {
                        [sortField]: sortOrder === 'desc' ? -1 : 1
                    }
                });
            }

            // Get total count before pagination
            const countPipeline = [...pipeline];
            const [countResult] = await Task.aggregate([...countPipeline, { $count: "total" }]);
            const total = countResult ? countResult.total : 0;

            // Get status counts for the current project
            const countsByStatus = await Task.aggregate([
                { $match: { projectId: new mongoose.Types.ObjectId(req.query.projectId) } },
                {
                    $addFields: {
                        isOverdue: {
                            $and: [
                                { $lt: ["$dueDate", new Date()] },
                                { 
                                    $not: { 
                                        $in: ["$state", ["COMPLETED", "ARCHIVED"]] 
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$state",
                        count: { $sum: 1 },
                        overdue: { $sum: { $cond: ["$isOverdue", 1, 0] } }
                    }
                },
                {
                    $group: {
                        _id: null,
                        stateCounts: { $push: { state: "$_id", count: "$count" } },
                        totalOverdue: { $sum: "$overdue" }
                    }
                }
            ]);

            // Convert array of counts to object
            const stateCountsObj = (countsByStatus[0]?.stateCounts || []).reduce((acc, { state, count }) => {
                acc[state] = count;
                return acc;
            }, {
                CREATED: 0,
                IN_PROGRESS: 0,
                COMPLETED: 0,
                ARCHIVED: 0
            });

            const counts = {
                ...stateCountsObj,
                OVERDUE: countsByStatus[0]?.totalOverdue || 0
            };

            // Add pagination
            pipeline.push(
                { $skip: skip },
                { $limit: limit },
                { 
                    $project: {
                        description: 1,
                        state: 1,
                        notes: 1,
                        dueDate: 1,
                        projectId: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            );

            const tasks = await Task.aggregate(pipeline);

            res.send({ 
                tasks, 
                total,
                counts
            });
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
