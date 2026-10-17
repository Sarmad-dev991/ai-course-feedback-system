const db = require("../config/db");
const { analyzeFeedbackText } = require("../services/aiAnalysis.service");

// GET ALL AI ANALYSES

const getAIAnalyses = (req, res) => {
  const userId = Number(req.user?.userId);
  const role = String(req.user?.role || "").toLowerCase();

  // Admin can view all saved AI analyses.
  if (role === "admin") {
    const sql = `
      SELECT
        aa.id,
        aa.submission_id,
        aa.analysis_type,
        aa.result,
        aa.created_at
      FROM ai_analyses aa
      ORDER BY aa.id DESC
    `;

    return db.query(sql, (error, rows) => {
      if (error) {
        console.error("Get AI analyses error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to load AI analyses."
        });
      }

      return res.status(200).json({
        success: true,
        count: rows.length,
        data: rows
      });
    });
  }

  // Only an authenticated instructor can view instructor-specific analyses.
  if (role !== "instructor" || !Number.isInteger(userId) || userId <= 0) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view these AI analyses."
    });
  }

  // Get analyses linked to this instructor's assigned batches.
  const sql = `
    SELECT DISTINCT
      aa.id,
      aa.submission_id,
      aa.analysis_type,
      aa.result,
      aa.created_at
    FROM instructors i
    INNER JOIN batch_instructors bi
      ON bi.instructor_id = i.id
    INNER JOIN batches b
      ON b.id = bi.batch_id
    INNER JOIN feedback_forms ff
      ON ff.batch_id = b.id
    INNER JOIN feedback_submissions fs
      ON fs.form_id = ff.id
    INNER JOIN ai_analyses aa
      ON aa.submission_id = fs.id
    WHERE i.user_id = ?
    ORDER BY aa.id DESC
  `;

  db.query(sql, [userId], (error, rows) => {
    if (error) {
      console.error("Get instructor AI analyses error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load instructor AI analyses."
      });
    }

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
};



// GET AI ANALYSIS BY ID
const getAIAnalysisById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            aa.id,
            aa.submission_id,
            aa.analysis_type,
            aa.result,
            aa.created_at
        FROM ai_analyses aa
        WHERE aa.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch AI analysis"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "AI analysis not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE AI ANALYSIS
const createAIAnalysis = (req, res) => {
    const {
        submission_id,
        analysis_type,
        result
    } = req.body;

    if (!analysis_type) {
        return res.status(400).json({
            success: false,
            message: "analysis_type is required"
        });
    }

    // submission_id is optional because
    // analysis may later be generated for aggregated reports.

    if (submission_id) {
        db.query(
            "SELECT id FROM feedback_submissions WHERE id = ?",
            [submission_id],
            (submissionErr, submissionResults) => {
                if (submissionErr) {
                    console.error(submissionErr);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to check submission"
                    });
                }

                if (submissionResults.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Feedback submission not found"
                    });
                }

                insertAnalysis();
            }
        );
    } else {
        insertAnalysis();
    }

    function insertAnalysis() {
        const sql = `
            INSERT INTO ai_analyses
            (
                submission_id,
                analysis_type,
                result
            )
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [
                submission_id || null,
                analysis_type,
                result || null
            ],
            (err, resultData) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to create AI analysis"
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "AI analysis created successfully",
                    data: {
                        id: resultData.insertId,
                        submission_id: submission_id || null,
                        analysis_type,
                        result: result || null
                    }
                });
            }
        );
    }
};


// UPDATE AI ANALYSIS
const updateAIAnalysis = (req, res) => {
    const id = Number(req.params.id);

    const {
        submission_id,
        analysis_type,
        result
    } = req.body;

    db.query(
        "SELECT id FROM ai_analyses WHERE id = ?",
        [id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error(checkErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check AI analysis"
                });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "AI analysis not found"
                });
            }

            const sql = `
                UPDATE ai_analyses
                SET
                    submission_id = COALESCE(?, submission_id),
                    analysis_type = COALESCE(?, analysis_type),
                    result = COALESCE(?, result)
                WHERE id = ?
            `;

            db.query(
                sql,
                [
                    submission_id,
                    analysis_type,
                    result,
                    id
                ],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to update AI analysis"
                        });
                    }

                    res.json({
                        success: true,
                        message: "AI analysis updated successfully"
                    });
                }
            );
        }
    );
};


// DELETE AI ANALYSIS
const deleteAIAnalysis = (req, res) => {
    const id = Number(req.params.id);

    db.query(
        "DELETE FROM ai_analyses WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete AI analysis"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "AI analysis not found"
                });
            }

            res.json({
                success: true,
                message: "AI analysis deleted successfully"
            });
        }
    );
};

// ANALYZE FEEDBACK SUBMISSION
const analyzeSubmission = async (req, res) => {
    const submissionId = Number(req.params.submissionId);

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid submission ID"
        });
    }

    const sql = `
        SELECT
            tr.response_type,
            tr.response_text
        FROM text_responses tr
        WHERE tr.submission_id = ?
        AND tr.response_text IS NOT NULL
        AND TRIM(tr.response_text) <> ''
        ORDER BY tr.id ASC
    `;

    db.query(sql, [submissionId], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch feedback text"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No text feedback found for this submission"
            });
        }

        const feedbackText = results
            .map(item => `${item.response_type}: ${item.response_text}`)
            .join("\n");

        try {
            const analysis = await analyzeFeedbackText(feedbackText);

            const resultJson = JSON.stringify(analysis);

            const insertSql = `
                INSERT INTO ai_analyses
                (
                    submission_id,
                    analysis_type,
                    result
                )
                VALUES (?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    submissionId,
                    "feedback_analysis",
                    resultJson
                ],
                (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error(insertErr);
                        return res.status(500).json({
                            success: false,
                            message: "AI analysis generated but could not be saved"
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "AI analysis generated successfully",
                        data: {
                            id: insertResult.insertId,
                            submission_id: submissionId,
                            analysis_type: "feedback_analysis",
                            analysis
                        }
                    });
                }
            );

        } catch (aiError) {
            console.error("AI Error:", aiError);

            res.status(500).json({
                success: false,
                message: "Failed to generate AI analysis"
            });
        }
    });
};

module.exports = {
    getAIAnalyses,
    getAIAnalysisById,
    createAIAnalysis,
    updateAIAnalysis,
    deleteAIAnalysis,
    analyzeSubmission
};