use std::{env, fs};

use advent_of_code_23_08::{parse_challenge, parse_challenge_optimized, solve_part_2_heavily_optimized, solve_part_2_super_heavily_optimized};

fn main() {
    let file_name: String = env::args().nth(1).expect(
        "You must pass the filename of the challenge input as first argument to this program",
    );

    println!("Reading {file_name}");

    let challenge = fs::read_to_string(file_name).expect("Could not read the file you told me to analyze");

    let walker =
        parse_challenge(&challenge);

    let power_walker = parse_challenge_optimized(&challenge);

    println!("Parsed challenge");

    // let result_part_2 = solve_part_2_heavily_optimized(walker);
    // println!("Result is {result_part_2}");

    let result_part_2_2 = solve_part_2_super_heavily_optimized(power_walker);
    println!("Result is {result_part_2_2}");
}
