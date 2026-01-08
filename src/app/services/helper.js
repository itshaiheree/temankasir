import { getAllHarapanService } from "./harapanService";
import { addHarapan } from "../module/addHarapan";

export async function getAllHarapan(page = 1, limit = 14) {
  try {
    return await getAllHarapanService(page, limit);
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

export async function tambahHarapan(sender, msg) {
  try {
    return await addHarapan(sender, msg);
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}
