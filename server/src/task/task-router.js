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

            const { sortField, sortOrder, projectId, status, search } = req.query;

            const match = {};

            if (projectId) {
                match.projectId = new mongoose.Types.ObjectId(projectId);
            }

            if (status && status !== 'OVERDUE') {
                match.state = status.toUpperCase();
            }

            if (search) {
                match.$or = [
                    { description: { $regex: search, $options: 'i' } },
                    { notes: { $regex: search, $options: 'i' } }
                ];
            }

            const pipeline = [{ $match: match }];

            // Handle special "OVERDUE" case
            if (status === 'OVERDUE') {
                pipeline.push({
                    $match: {
                        dueDate: { $lt: new Date() },
                        state: { $nin: ['COMPLETED', 'ARCHIVED'] }
                    }
                });
            }

            const allowedSortFields = ['dueDate', 'createdAt', 'updatedAt'];
            if (sortField && allowedSortFields.includes(sortField)) {
                pipeline.push({
                    $sort: {
                        [sortField]: sortOrder === 'desc' ? -1 : 1
                    }
                });
            }

            const countPipeline = [...pipeline];
            const [countResult] = await Task.aggregate([...countPipeline, { $count: 'total' }]);
            const total = countResult ? countResult.total : 0;

            // Status counts by state (for sidebar/filter info)
            const statusFilterMatch = projectId
                ? { projectId: new mongoose.Types.ObjectId(projectId) }
                : {};

            const countsByStatus = await Task.aggregate([
                { $match: statusFilterMatch },
                {
                    $addFields: {
                        isOverdue: {
                            $and: [
                                { $lt: ['$dueDate', new Date()] },
                                {
                                    $not: {
                                        $in: ['$state', ['COMPLETED', 'ARCHIVED']]
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: '$state',
                        count: { $sum: 1 },
                        overdue: { $sum: { $cond: ['$isOverdue', 1, 0] } }
                    }
                },
                {
                    $group: {
                        _id: null,
                        stateCounts: { $push: { state: '$_id', count: '$count' } },
                        totalOverdue: { $sum: '$overdue' }
                    }
                }
            ]);

            const stateCountsObj = (countsByStatus[0]?.stateCounts || []).reduce((acc, { state, count }) => {
                acc[state] = count;
                return acc;
            }, {
                CREATED: 0,
                IN_PROGRESS: 0,
                COMPLETED: 0,
                ARCHIVED: 0
            });

            const allMatch = {};
            if (projectId) {
                allMatch.projectId = new mongoose.Types.ObjectId(projectId);
            }
            const totalAll = await Task.countDocuments(allMatch);

            const counts = {
                ...stateCountsObj,
                OVERDUE: countsByStatus[0]?.totalOverdue || 0,
                ALL: totalAll
            };

            // Pagination
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

            res.send({ tasks, total, counts });

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
