import express from "express";
import { Project } from "./project-model.js";

const router = express.Router();
const BASE_PATH = "/api/projects";
const DEFAULT_PROJECT_AMOUNT = 20

router
  .route(BASE_PATH)
  // find all
    .get(async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || DEFAULT_PROJECT_AMOUNT;
            const skip = (page - 1) * limit;
            const { status, search } = req.query;

            const pipeline = [
                {
                    $lookup: {
                        from: "tasks",
                        localField: "_id",
                        foreignField: "projectId",
                        as: "tasks",
                    },
                },
            ];

            // Add search match if provided
            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } }
                        ]
                    }
                });
            }

            pipeline.push({
                $addFields: {
                    taskCount: { $size: "$tasks" },
                    inProgress: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$tasks",
                                        as: "task",
                                        cond: { $eq: ["$$task.state", "IN_PROGRESS"] },
                                    },
                                },
                            },
                            0,
                        ],
                    },
                    completed: {
                        $cond: [
                            { $gt: [{ $size: "$tasks" }, 0] },
                            {
                                $eq: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$tasks",
                                                as: "task",
                                                cond: { $eq: ["$$task.state", "COMPLETED"] },
                                            },
                                        },
                                    },
                                    { $size: "$tasks" },
                                ],
                            },
                            false,
                        ],
                    },
                },
            });

            // Add status filter if provided
            if (status === 'completed') {
                pipeline.push({ $match: { completed: true } });
            } else if (status === 'in_progress') {
                pipeline.push({ $match: { inProgress: true, completed: false } });
            }

            // Get total count before pagination
            const countPipeline = [...pipeline];
            const [countResult] = await Project.aggregate([...countPipeline, { $count: "total" }]);
            const total = countResult ? countResult.total : 0;

            // Get status counts
            const countsByStatus = await Project.aggregate([
                {
                    $lookup: {
                        from: "tasks",
                        localField: "_id",
                        foreignField: "projectId",
                        as: "tasks",
                    },
                },
                {
                    $addFields: {
                        hasInProgressTasks: {
                            $gt: [
                                {
                                    $size: {
                                        $filter: {
                                            input: "$tasks",
                                            as: "task",
                                            cond: { $eq: ["$$task.state", "IN_PROGRESS"] },
                                        },
                                    },
                                },
                                0,
                            ],
                        },
                        allTasksCompleted: {
                            $cond: [
                                { $gt: [{ $size: "$tasks" }, 0] },
                                {
                                    $eq: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: "$tasks",
                                                    as: "task",
                                                    cond: { $ne: ["$$task.state", "COMPLETED"] },
                                                },
                                            },
                                        },
                                        0,
                                    ],
                                },
                                false,
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        in_progress: {
                            $sum: {
                                $cond: [
                                    { $and: [
                                        "$hasInProgressTasks",
                                        { $not: "$allTasksCompleted" }
                                    ]},
                                    1,
                                    0
                                ]
                            }
                        },
                        completed: {
                            $sum: {
                                $cond: ["$allTasksCompleted", 1, 0]
                            }
                        },
                        total: { $sum: 1 }
                    }
                }
            ]);

            // Add pagination
            pipeline.push(
                { $skip: skip },
                { $limit: limit },
                { $project: { tasks: 0 } }
            );

            const projects = await Project.aggregate(pipeline);
            const counts = countsByStatus[0] || { in_progress: 0, completed: 0, total: 0 };

            res.send({ 
                projects, 
                total,
                counts: {
                    in_progress: counts.in_progress,
                    completed: counts.completed,
                    total: counts.total
                }
            });
        } catch (err) {
            next(err);
        }
    })
  // create new
  .post(async (req, res, next) => {
    try {
      const project = await Project.create(req.body);
      res.send(project);
    } catch (err) {
      next(err);
    }
  });

router
  .route(`${BASE_PATH}/:id`)
  // get one
  .get((req, res, next) => {
    Project.findById(req.params.id)
      .lean()
      .orFail()
      .then((project) => res.send(project))
      .catch(next);
  })
  // update
  .put(async (req, res, next) => {
    try {
      const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .lean()
        .orFail();
      res.send(project);
    } catch (err) {
      next(err);
    }
  })
  // delete
  .delete(async (req, res, next) => {
    try {
      await Project.findByIdAndDelete(req.params.id)
        .lean()
        .orFail();
      res.send(req.params);
    } catch (err) {
      next(err);
    }
  });

export default router;
