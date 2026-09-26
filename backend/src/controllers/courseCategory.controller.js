let categories = [
    {
        id: 1,
        name: "Web Development",
        description: "Courses related to web development and programming"
    },
    {
        id: 2,
        name: "Artificial Intelligence",
        description: "Courses related to AI and machine learning"
    },
    {
        id: 3,
        name: "Digital Marketing & SEO",
        description: "Courses related to digital marketing and SEO"
    },
    {
        id: 4,
        name: "Graphic Design",
        description: "Courses related to graphic design and creative skills"
    }
];


// Get all categories
const getCategories = (req, res) => {

    res.json({
        success: true,
        count: categories.length,
        data: categories
    });

};


// Get category by ID
const getCategoryById = (req, res) => {

    const id = Number(req.params.id);

    const category = categories.find(
        category => category.id === id
    );

    if (!category) {
        return res.status(404).json({
            success: false,
            message: "Category not found"
        });
    }

    res.json({
        success: true,
        data: category
    });

};


// Create category
const createCategory = (req, res) => {

    const {
        name,
        description
    } = req.body;


    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Category name is required"
        });
    }


    const newCategory = {

        id: categories.length + 1,

        name,

        description: description || ""

    };


    categories.push(newCategory);


    res.status(201).json({

        success: true,

        message: "Category created successfully",

        data: newCategory

    });

};


// Update category
const updateCategory = (req, res) => {

    const id = Number(req.params.id);

    const category = categories.find(
        category => category.id === id
    );


    if (!category) {
        return res.status(404).json({
            success: false,
            message: "Category not found"
        });
    }


    const {
        name,
        description
    } = req.body;


    category.name =
        name ?? category.name;

    category.description =
        description ?? category.description;


    res.json({

        success: true,

        message: "Category updated successfully",

        data: category

    });

};


// Delete category
const deleteCategory = (req, res) => {

    const id = Number(req.params.id);


    const exists = categories.some(
        category => category.id === id
    );


    if (!exists) {
        return res.status(404).json({
            success: false,
            message: "Category not found"
        });
    }


    categories = categories.filter(
        category => category.id !== id
    );


    res.json({

        success: true,

        message: "Category deleted successfully"

    });

};


module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};