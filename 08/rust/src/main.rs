use std::{env, fs};

use advent_of_code_23_08::{AOC8Solver, PowerWalker, Walker};

fn main() {
    let file_name: String = env::args().nth(1).expect(
        "You must pass the filename of the challenge input as first argument to this program",
    );

    println!("Reading {file_name}");

    let challenge = fs::read_to_string(file_name).expect("Could not read the file you told me to analyze");

    let walker =
        PowerWalker::new(challenge);
        // Walker::new(challenge);

    let result_part_2 = walker.solve();
    println!("Part 2's result is {result_part_2}");
}
