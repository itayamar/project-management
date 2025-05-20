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
                            false, // if no tasks, not completed
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

            // Add pagination
            pipeline.push(
                { $skip: skip },
                { $limit: limit },
                { $project: { tasks: 0 } }
            );

            const projects = await Project.aggregate(pipeline);

            res.send({ projects, total });
        } catch (err) {
            next(err);
        }
    })
  // create new
  .post((req, res, next) => {
    Project.create(req.body)
      .then((project) => res.send(project))
      .catch(next);
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
  .put((req, res, next) => {
    Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .lean()
      .orFail()
      .then((project) => res.send(project))
      .catch(next);
  })
  // delete
  .delete((req, res, next) => {
    Project.findByIdAndDelete(req.params.id)
      .lean()
      .orFail()
      .then(() => res.send(req.params))
      .catch(next);
  });

export default router;
