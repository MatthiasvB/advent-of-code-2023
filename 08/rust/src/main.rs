use std::{env, fs};

use advent_of_code_23_08::{parse_challenge, solve_part_2_heavily_optimized};

fn main() {
    let file_name: String = env::args().nth(1).expect(
        "You must pass the filename of the challenge input as first argument to this program",
    );

    println!("Reading {file_name}");

    let challenge =
        parse_challenge(&fs::read_to_string(file_name).expect("Could not read the file you told me to analyze"));

    println!("Parsed challenge");

    let result_part_2 = solve_part_2_heavily_optimized(challenge);

    println!("Result is {result_part_2}");
}
