const AddModel = require('../AddModel'); // Property model
const PricingPlans = require('../plans/PricingPlanModel'); // Plan model

const addProperty = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.',
      });
    }

    // Step 1: Check for active plan
    const userPlan = await PricingPlans.findOne({
      phoneNumber: { $in: [phoneNumber] },
      status: 'active',
    });

    if (!userPlan) {
      return res.status(403).json({
        success: false,
        message: 'No active plan found. Please purchase a plan to post a property.',
        planStatus: 0
      });
    }

    const {
      numOfCars = 0,
      usedCars = 0,
      remainingCars = 0,
      name: planName
    } = userPlan;

    // Step 2: Check posting limit
    if (remainingCars <= 0) {
      return res.status(403).json({
        success: false,
        message: `Your plan (${planName}) has reached its property posting limit. Please upgrade your plan.`,
        planStatus: 1,
        planName,
        numOfCars,
        usedCars,
        remainingCars
      });
    }

    // Step 3: Add property
    const newProperty = new AddModel(req.body);
    await newProperty.save();

    // Step 4: Update plan usage
    userPlan.usedCars = usedCars + 1;
    userPlan.remainingCars = remainingCars - 1;
    await userPlan.save();

    return res.status(201).json({
      success: true,
      message: 'Property posted successfully.',
      planStatus: 1,
      planName,
      numOfCars,
      usedCars: userPlan.usedCars,
      remainingCars: userPlan.remainingCars,
      property: newProperty
    });

  } catch (error) {
    console.error('Add Property Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while posting the property.',
    });
  }
};

module.exports = { addProperty };



