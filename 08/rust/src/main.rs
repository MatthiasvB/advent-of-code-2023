use std::{env, fs};

mod walker;
mod tapif;

use walker::{AOC8Solver, AOCTracer, PowerWalker, Walker};

use crate::walker::get_walker;

fn main() {
    let file_name: String = env::args().nth(1).expect(
        "You must pass the filename of the challenge input as first argument to this program",
    );

    println!("Reading {file_name}");

    let challenge =
        fs::read_to_string(file_name).expect("Could not read the file you told me to analyze");

    let walker_wrapper = get_walker(challenge);
    let walker = 
        walker_wrapper.get();
        // Walker::new(&challenge);
        //PowerWalker::new(&challenge);

    /* let result_part_1 = walker.solve_part_1();
    //let result_part_2 = walker.solve_part_2();
    println!("Part 1's result is {result_part_1}");
    //println!("Part 2's result is {result_part_2}");
    
    let all_starts = walker.start_positions.clone();
    let traced_locations = all_starts.iter().map(|location| {
        (location.to_owned(), walker.get_all_locations_traversed_by(location.to_string(), 1_000_000, true).expect(&format!("Could not trace {}", location)))
    });

    for trace in traced_locations.clone() {
        println!("{} traced {} locations: {:?}", trace.0, trace.1.len(), trace.1);
    }
    println!("\n That's {} locations in total", traced_locations.map(|el| el.1.len()).sum::<usize>()); */

    (0..50000).into_iter().zip(walker.iter_steps(true)).for_each(|(_, step)| {
        println!("{}", step);
    });
}
